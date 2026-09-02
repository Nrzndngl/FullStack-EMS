import Payslip from "../models/Payslip.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { recordAudit } from "../utils/audit.js";
import { monthRangeForYearMonth } from "../utils/time.js";
import { sendPayslipEmail } from "../utils/notifications.js";

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

                const [workingDays] = await Promise.all([
                    Attendance.countDocuments({
                        employeeId: employee._id,
                        date: { $gte: start, $lt: end },
                        status: { $in: ["PRESENT", "LATE"] },
                    }),
                ]);

                const basicSalary = Number(employee.basicSalary) || 0;
                const allowances = Number(employee.allowances) || 0;
                const deductions = Number(employee.deductions) || 0;

                await Payslip.create({
                    employeeId: employee._id,
                    month: Number(month),
                    year: Number(year),
                    basicSalary,
                    allowances,
                    deductions,
                    netSalary: basicSalary + allowances - deductions,
                    workingDays,
                    overtimeHours: 0,
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
        const isAdmin = session.role === "ADMIN";
        if (isAdmin) {
            const payslips = await Payslip.find().populate("employeeId").
                sort({ createdAt: -1 });
            const data = payslips.map((p) => {
                const obj = p.toObject();
                return {
                    ...obj,
                    id: obj._id.toString(),
                    employee: obj.employeeId,
                    employeeId: obj.employeeId?._id?.toString(),
                }
            })
            return res.json({ data });
        } else {
            const employee = await Employee.findOne({ userId: session.userId });
            if (!employee) {
                return res.status(404).json({ error: "Employee not found" });
            }
            const payslips = await Payslip.find({ employeeId: employee._id }).sort({ createdAt: -1 });
            return res.json({ data: payslips });
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