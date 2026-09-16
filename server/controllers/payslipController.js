import Payslip from "../models/Payslip.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { recordAudit } from "../utils/audit.js";
import { monthRangeForYearMonth, nepalDateKey, daysBetweenNepalKeys } from "../utils/time.js";
import { sendPayslipEmail } from "../utils/notifications.js";
import { notifyUser } from "./notificationController.js";

// CREATE PAYSLIPS
export const createPayslip = async (req, res) => {
    try {
        const { employeeId, month, year, basicSalary, allowances,
            deductions, workingDays, overtimeHours } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const existing = await Payslip.findOne({ employeeId, month, year });
        if (existing) {
            return res.status(400).json({ error: "Payslip already exists for this employee and month" });
        }

        const netSalary = Number(basicSalary) + Number(allowances || 0) - Number(deductions || 0);

        const payslip = await Payslip.create({
            employeeId,
            month: Number(month),
            year: Number(year),
            basicSalary: Number(basicSalary),
            allowances: Number(allowances || 0),
            deductions: Number(deductions || 0),
            netSalary,
            workingDays: workingDays != null ? Number(workingDays) : null,
            overtimeHours: Number(overtimeHours || 0),
        });

        await recordAudit({
            actorId: req.session.userId,
            action: "PAYSLIP_CREATE",
            entity: "PAYSLIP",
            entityId: payslip._id,
            details: { employeeId, month, year, netSalary },
        });

        await sendPayslipEmail({
            to: employee.email,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            period: `${year}-${String(month).padStart(2, "0")}`,
            netSalary,
        });

        const linkedUser = await User.findOne({ email: employee.email }).select("_id").lean();
        if (linkedUser) {
            await notifyUser({
                userId: linkedUser._id,
                title: "Payslip ready",
                message: `Your payslip for ${year}-${String(month).padStart(2, "0")} has been generated. Net salary: ${netSalary}.`,
                type: "PAYSLIP",
                link: "/payslips",
                entityId: payslip._id,
            });
        }

        return res.json({ success: true, data: payslip });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Payslip already exists for this employee and month" })
        }
        return res.status(500).json({ error: "Failed to create payslip" })
    }
}

// BATCH-GENERATE PAYSLIPS FOR ALL ACTIVE EMPLOYEES FOR A MONTH
// Payroll amounts come from each employee's profile; attendance days are counted
// from the Nepal month range where present/late records exist.
export const generateBatchPayslips = async (req, res) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) {
            return res.status(400).json({ error: "month and year are required" });
        }
        const { start, end } = monthRangeForYearMonth(Number(year), Number(month));

        const employees = await Employee.find({ isDeleted: { $ne: true } }).lean();
        let created = 0;
        let skipped = 0;
        const errors = [];

        for (const employee of employees) {
            try {
                const existing = await Payslip.findOne({ employeeId: employee._id, month: Number(month), year: Number(year) });
                if (existing) { skipped++; continue; }

                // Count present days plus days covered by an approved leave so
                // payroll accrual stays aligned with the Nepal calendar.
                const [workingDays, overtimeResult, attendanceAgg] = await Promise.all([
                    Attendance.countDocuments({
                        employeeId: employee._id,
                        date: { $gte: start, $lt: end },
                        status: { $in: ["PRESENT", "LATE"] },
                    }),
                    Attendance.aggregate([
                        { $match: { employeeId: employee._id, date: { $gte: start, $lt: end } } },
                        { $group: { _id: null, total: { $sum: { $ifNull: ["$overtimeHours", 0] } } } },
                    ]),
                    Attendance.countDocuments({
                        employeeId: employee._id,
                        date: { $gte: start, $lt: end },
                    }),
                ]);
                const totalOvertime = overtimeResult.length ? overtimeResult[0].total : 0;

                // Add approved leave days inside the same range as paid days.
                const approvedLeaves = await LeaveApplication.find({
                    employeeId: employee._id,
                    status: "APPROVED",
                    startDate: { $lt: end },
                    endDate: { $gte: start },
                }).lean();
                const paidLeaveDays = approvedLeaves.reduce((acc, leave) => {
                    const s = nepalDateKey(leave.startDate) > nepalDateKey(start)
                        ? nepalDateKey(leave.startDate)
                        : new Date(start.getTime() + 18 * 60 * 60 * 1000).toISOString().slice(0, 10);
                    const e = nepalDateKey(leave.endDate) < nepalDateKey(end)
                        ? nepalDateKey(leave.endDate)
                        : new Date(end.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
                    if (s > e) return acc;
                    return acc + daysBetweenNepalKeys(s, e);
                }, 0);

                const basicSalary = Number(employee.basicSalary) || 0;
                const allowances = Number(employee.allowances) || 0;
                const deductions = Number(employee.deductions) || 0;
                const overtimePay = totalOvertime ? Math.round(totalOvertime * (basicSalary / (attendanceAgg || 1) / 8)) : 0;

                await Payslip.create({
                    employeeId: employee._id,
                    month: Number(month),
                    year: Number(year),
                    basicSalary,
                    allowances,
                    deductions,
                    netSalary: basicSalary + allowances - deductions + overtimePay,
                    workingDays: workingDays + paidLeaveDays,
                    overtimeHours: totalOvertime,
                });
                created++;
            } catch (e) {
                if (e.code === 11000) { skipped++; continue; }
                errors.push(`${employee.firstName} ${employee.lastName}: ${e.message}`);
            }
        }

        await recordAudit({
            actorId: req.session.userId,
            action: "PAYSLIP_BATCH",
            entity: "PAYSLIP",
            details: { month, year, created, skipped },
        });

        return res.json({ success: true, created, skipped, errors });
    } catch (error) {
        return res.status(500).json({ error: "Failed to generate batch payslips" });
    }
}

// GET ALL PAYSLIPS
export const getPayslips = async (req, res) => {
    try {
        const session = req.session;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const isAdmin = session.role === "ADMIN";
        if (isAdmin) {
            const [payslips, total] = await Promise.all([
                Payslip.find().populate("employeeId").
                    sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
                Payslip.countDocuments(),
            ]);
            const data = payslips.map((p) => {
                const obj = p.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                }
            })
            return res.json({ data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
        } else {
            const employee = await Employee.findOne({ userId: session.userId });
            if (!employee) {
                return res.status(404).json({ error: "Employee not found" });
            }
            const where = { employeeId: employee._id };
            const [payslips, total] = await Promise.all([
                Payslip.find(where).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
                Payslip.countDocuments(where),
            ]);
            return res.json({ data: payslips, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
        }

    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch payslips" })
    }
}

// GET SINGLE PAYSLIP BY ID
export const getPayslipById = async (req, res) => {
    try {
        const session = req.session;
        const payslip = await Payslip.findById(req.params.id).populate("employeeId").lean();

        if (!payslip) return res.status(404).json({ error: "Payslip not found" });

        // ADMINS can view any payslip; EMPLOYEES can only view their own
        if (session.role !== "ADMIN") {
            const employee = await Employee.findOne({ userId: session.userId }).lean();
            const employeeId = employee?._id?.toString();
            const ownerId = payslip.employeeId?._id?.toString();
            if (!employeeId || ownerId !== employeeId) {
                return res.status(403).json({ error: "Not authorized to view this payslip" });
            }
        }

        const result = {
            ...payslip,
            id: payslip._id.toString(),
            employee: payslip.employeeId,
        };

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch payslip" })
    }
}