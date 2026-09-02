import Attendance from "../models/Attendance.js";
import Payslip from "../models/Payslip.js";
import { csvResponse, toCSV } from "../utils/csv.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const employeeName = (emp) =>
    emp ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : "—";

// GET /api/reports/attendance.csv?limit=500 — ADMIN
export const exportAttendanceCsv = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || 500, 10);
        const records = await Attendance.find()
            .populate("employeeId", "firstName lastName email department")
            .sort({ date: -1 })
            .limit(limit)
            .lean();

        const headers = [
            "Date",
            "Employee",
            "Email",
            "Department",
            "Status",
            "Day Type",
            "Check In",
            "Check Out",
            "Working Hours",
        ];
        const rows = records.map((r) => [
            r.date ? r.date.toISOString().slice(0, 10) : "",
            employeeName(r.employeeId),
            r.employeeId?.email || "",
            r.employeeId?.department || "",
            r.status || "",
            r.dayType || "",
            r.checkIn ? new Date(r.checkIn).toISOString() : "",
            r.checkOut ? new Date(r.checkOut).toISOString() : "",
            r.workingHours ?? "",
        ]);
        return csvResponse(res, `attendance_${Date.now()}.csv`, toCSV(headers, rows));
    } catch (error) {
        return res.status(500).json({ error: "Failed to export attendance" });
    }
};

// GET /api/reports/payroll.csv?limit=500 — ADMIN
export const exportPayrollCsv = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || 500, 10);
        const payslips = await Payslip.find()
            .populate("employeeId", "firstName lastName email department")
            .sort({ year: -1, month: -1 })
            .limit(limit)
            .lean();

        const headers = [
            "Employee",
            "Email",
            "Department",
            "Period",
            "Basic Salary",
            "Allowances",
            "Deductions",
            "Working Days",
            "Net Salary",
        ];
        const rows = payslips.map((p) => {
            const period = `${MONTHS[p.month - 1] || p.month} ${p.year}`;
            return [
                employeeName(p.employeeId),
                p.employeeId?.email || "",
                p.employeeId?.department || "",
                period,
                p.basicSalary ?? "",
                p.allowances ?? "",
                p.deductions ?? "",
                p.workingDays ?? "",
                p.netSalary ?? "",
            ];
        });
        return csvResponse(res, `payroll_${Date.now()}.csv`, toCSV(headers, rows));
    } catch (error) {
        return res.status(500).json({ error: "Failed to export payroll" });
    }
};