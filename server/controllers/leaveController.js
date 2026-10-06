import { inngest } from "../inngest/index.js";
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { dayRangeForDateKey, daysBetweenNepalKeys, nepalDateKey } from "../utils/time.js";
import { recordAudit } from "../utils/audit.js";
import { sendLeaveDecisionEmail } from "../utils/notifications.js";
import { notifyUser } from "./notificationController.js";
import { queryId } from "../validators/index.js";

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
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (Number.isNaN(startDateObj.getTime()) || Number.isNaN(endDateObj.getTime())) {
            return res.status(400).json({ error: "Invalid leave dates" });
        }
        const startKey = nepalDateKey(startDateObj);
        const endKey = nepalDateKey(endDateObj);

        if (endKey < startKey) {
            return res.status(400).json({
                error: "End Date cannot be before start date"
            });
        }
        if (startKey <= nepalDateKey()) {
            return res.status(400).json({
                error: "Leave dates must be in the future"
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

        // Reject overlapping pending/approved applications so the same calendar
        // days cannot be submitted (and later approved) twice.
        const newStart = dayRangeForDateKey(startKey).start;
        const newEnd = dayRangeForDateKey(endKey).start;
        const overlapping = await LeaveApplication.findOne({
            employeeId: employee._id,
            status: { $in: ["PENDING", "APPROVED"] },
            startDate: { $lte: newEnd },
            endDate: { $gte: newStart },
        });
        if (overlapping) {
            return res.status(400).json({ error: "You already have a pending or approved leave for an overlapping period" });
        }

        const leave = await LeaveApplication.create({
            employeeId: employee._id,
            type,
            startDate: dayRangeForDateKey(startKey).start,
            endDate: dayRangeForDateKey(endKey).start,
            reason,
            status: "PENDING",
        })

        try {
            await inngest.send({
                name: "leave/pending",
                data: {
                    leaveApplicationId: leave._id,
                },
            })
        } catch (err) {
            // Fire-and-forget: a dead Inngest client must never turn a
            // successful leave application into a 500 (which would trigger
            // a duplicate-application retry on the client).
            console.error("inngest send failed (leave apply):", err);
        }

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
            const status = ["PENDING", "APPROVED", "REJECTED"].includes(req.query.status) ? req.query.status : undefined;
            const where = status ? { status } : {};
            // Admin-only per-employee scoping so detail views can fetch one
            // employee's leave history instead of an unrelated page.
            if (req.query.employeeId) {
                const employeeId = queryId(req.query.employeeId);
                if (!employeeId) return res.status(400).json({ error: "Invalid employeeId" });
                where.employeeId = employeeId;
            }
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
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid leave id" });
        }
        const { status } = req.body;

        let leave = await LeaveApplication.findById(id);
        if (!leave) return res.status(404).json({ error: "Leave not found" });

        // Idempotent: re-sending the same status (e.g. approving an already
        // approved leave) must not re-deduct the balance.
        if (leave.status === status) {
            return res.json({ success: true, data: leave });
        }

        if (status === "APPROVED") {
            const days = Math.max(1, daysBetweenNepalKeys(
                nepalDateKey(leave.startDate),
                nepalDateKey(leave.endDate)
            ));
            // Reverting to this status if the floor check below fails.
            const prevStatus = leave.status;

            // Atomic transition so two concurrent approvals cannot double-deduct.
            const updated = await LeaveApplication.findOneAndUpdate(
                { _id: id, status: { $ne: "APPROVED" } },
                { $set: { status: "APPROVED" } },
                { new: true }
            );
            if (!updated) {
                // Already APPROVED by a concurrent request -> idempotent success.
                const current = await LeaveApplication.findById(id);
                return res.json({ success: true, data: current });
            }
            leave = updated;

            // Deduct atomically with a floor: never approve into a negative
            // balance, even when two different leaves race for the same days.
            const result = await Employee.updateOne(
                { _id: leave.employeeId, [`leaveBalance.${leave.type}`]: { $gte: days } },
                { $inc: { [`leaveBalance.${leave.type}`]: -days } }
            );
            if (result.modifiedCount !== 1) {
                await LeaveApplication.updateOne(
                    { _id: id },
                    { $set: { status: prevStatus } }
                );
                const balance = (await Employee.findById(leave.employeeId)
                    .select(`leaveBalance.${leave.type}`).lean())?.leaveBalance?.[leave.type];
                return res.status(400).json({
                    error: `Insufficient ${leave.type} leave balance (${days} required, ${balance ?? 0} remaining) — cannot approve`,
                });
            }
        } else {
            const previouslyApproved = leave.status === "APPROVED";
            const updated = await LeaveApplication.findOneAndUpdate(
                { _id: id },
                { $set: { status } },
                { new: true }
            );
            if (!updated) return res.status(404).json({ error: "Leave not found" });
            leave = updated;

            // Rejecting an approved leave must return the days that were
            // deducted on approval, so re-approving later cannot charge twice.
            if (previouslyApproved && status === "REJECTED") {
                const days = Math.max(1, daysBetweenNepalKeys(
                    nepalDateKey(leave.startDate),
                    nepalDateKey(leave.endDate)
                ));
                await Employee.updateOne(
                    { _id: leave.employeeId },
                    { $inc: { [`leaveBalance.${leave.type}`]: days } }
                );
            }
        }

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

