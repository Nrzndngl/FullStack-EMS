import { inngest } from "../inngest/index.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { dayRangeForDateKey, daysBetweenNepalKeys, nepalDateKey } from "../utils/time.js";
import { recordAudit } from "../utils/audit.js";
import { sendLeaveDecisionEmail } from "../utils/notifications.js";
import { notifyUser } from "./notificationController.js";

// CREATE LEAVE
export const createLeave = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({
            userId: session.userId
        })
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) {
            return res.status(403).json({
                error: "Your account is deactivated. You cannot apply for leave.",
            })
        }

        const { type, startDate, endDate, reason } = req.body;

        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({
                error: "Missing fields"
            });
        }

        // Normalize + validate using Nepal calendar days
        const startKey = nepalDateKey(new Date(startDate));
        const endKey = nepalDateKey(new Date(endDate));
        if (startKey <= nepalDateKey() || endKey <= nepalDateKey()) {
            return res.status(400).json({
                error: "Leave dates must be in the future"
            });
        }

        if (endKey < startKey) {
            return res.status(400).json({
                error: "End Date cannot be before start date"
            });
        }

        // Leave balance check
        const requestedDays = daysBetweenNepalKeys(startKey, endKey);
        const available = employee.leaveBalance?.[type];
        if (available != null && requestedDays > available) {
            return res.status(400).json({
                error: `Insufficient ${type} leave balance (${requestedDays} requested, ${available} remaining)`,
            });
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate: dayRangeForDateKey(startKey).start,
            endDate: dayRangeForDateKey(endKey).start,
            reason,
            status: "PENDING",
        })

        await inngest.send({
            name: "leave/pending",
            data: {
                leaveApplicationId: leave._id,
            },
        })

        // Notify admins about the new pending leave application
        const admins = await User.find({ role: "ADMIN" }).select("_id").lean();
        const adminIds = admins.map((a) => a._id.toString());
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        await Promise.all(adminIds.map((adminId) =>
            notifyUser({
                userId: adminId,
                title: "New leave application",
                message: `${employeeName} applied for ${type} leave (${startKey} to ${endKey}).`,
                type: "LEAVE",
                link: "/leave",
                entityId: leave._id,
            })
        ));

        return res.json({ success: true, data: leave })
    } catch (error) {
        return res.status(500).json({ error: "Failed to apply for leave" })
    }
}

//GET LEAVES
export const getLeaves = async (req, res) => {
    try {
        const session = req.session;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const isAdmin = session.role === "ADMIN";
        if (isAdmin) {
            const status = req.query.status;
            const where = status ? { status } : {};
            const [leaves, total] = await Promise.all([
                LeaveApplication.find(where).populate("employeeId").sort({ startDate: -1 }).skip((page - 1) * pageSize).limit(pageSize),
                LeaveApplication.countDocuments(where),
            ]);

            const data = leaves.map((l) => {
                const obj = l.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employeeId: obj.employeeId?._id?.toString(),
                    employee: obj.employeeId,
                }
            })
            return res.json({ data: data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
        } else {
            const employee = await Employee.findOne({
                userId: session.userId,
            }).lean();
            if (!employee) return res.status(404).json({
                error: "Not found"
            });
            const where = { employeeId: employee._id };
            const [leaves, total] = await Promise.all([
                LeaveApplication.find(where).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
                LeaveApplication.countDocuments(where),
            ]);
            return res.json({
                data: leaves,
                employee: { ...employee, id: employee._id.toString() },
                page, pageSize, total, totalPages: Math.ceil(total / pageSize)
            })
        }

    } catch (error) {
        return res.status(500).json({ error: "Failed" });

    }

}

// UPDATE LEAVE STATUS
export const updateLeaveStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const leave = await LeaveApplication.findById(req.params.id);
        if (!leave) return res.status(404).json({ error: "Leave not found" });

        if (leave.status === status) {
            return res.json({ success: true, data: leave });
        }

        // Deduct entitlement exactly once when a request first becomes APPROVED
        if (status === "APPROVED") {
            const days = daysBetweenNepalKeys(
                nepalDateKey(leave.startDate),
                nepalDateKey(leave.endDate)
            );
            await Employee.updateOne(
                { _id: leave.employeeId },
                { $inc: { [`leaveBalance.${leave.type}`]: -days } }
            );
        }

        leave.status = status;
        await leave.save();

        await recordAudit({
            actorId: req.session.userId,
            action: "LEAVE_STATUS",
            entity: "LEAVE",
            entityId: leave._id,
            details: { status, type: leave.type },
        });

        if (status === "APPROVED" || status === "REJECTED") {
            const employee = await Employee.findById(leave.employeeId).lean();
            if (employee) {
                await sendLeaveDecisionEmail({
                    to: employee.email,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    type: leave.type,
                    status,
                    startDate: nepalDateKey(leave.startDate),
                    endDate: nepalDateKey(leave.endDate),
                    reason: leave.reason,
                });
                // In-app notification for the employee
                const linkedUser = await User.findOne({ email: employee.email }).select("_id").lean();
                if (linkedUser) {
                    await notifyUser({
                        userId: linkedUser._id,
                        title: `Leave ${status.toLowerCase()}`,
                        message: `Your ${leave.type} leave (${nepalDateKey(leave.startDate)} to ${nepalDateKey(leave.endDate)}) was ${status.toLowerCase()}.`,
                        type: "LEAVE",
                        link: "/leave",
                        entityId: leave._id,
                    });
                }
            }
        }

        return res.json({ success: true, data: leave })
    } catch (error) {
        return res.status(500).json({ error: "Failed" });

    }
}

