import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { DEPARTMENTS } from "../constants/departments.js";
import Payslip from "../models/Payslip.js";
import { monthRangeForYearMonth, nepalTodayRange, nepalYearMonth } from "../utils/time.js";

// GET DASHBOARD FROM EMPLOYEE AND ADMIN
export const getDashboard = async (req, res) => {
    try {
        const session = req.session;
        if (session.role === "ADMIN") {
            const [totalEmployees, todayAttendance, pendingLeaves] = await
                Promise.all([
                    Employee.countDocuments({ isDeleted: { $ne: true } }),
                    (async () => {
                        const { start, end } = nepalTodayRange();
                        return Attendance.countDocuments({ date: { $gte: start, $lt: end } });
                    })(),

                    LeaveApplication.countDocuments({ status: "PENDING" }),
                ]);
            return res.json({
                role: "ADMIN",
                totalEmployees,
                totalDepartments: DEPARTMENTS.length,
                todayAttendance,
                pendingLeaves
            })
        }
        else {
            const employee = await Employee.findOne({
                userId: session.userId,
            }).lean();
            if (!employee) return res.status(404).json({ error: "Employee not found" });

            const { year, month } = nepalYearMonth();
            const { start, end } = monthRangeForYearMonth(year, month);
            const [currentMonthAttendance, pendingLeaves, latestPayslip] = await Promise.all([
                Attendance.countDocuments({
                    employeeId: employee._id,
                    date: { $gte: start, $lt: end },
                }),
                LeaveApplication.countDocuments({
                    employeeId: employee._id,
                    status: "PENDING",
                }),
                Payslip.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean(),
            ]);

            return res.json({
                role: "EMPLOYEE",
                employee: { ...employee, id: employee._id.toString() },
                currentMonthAttendance,
                pendingLeaves,
                latestPayslip: latestPayslip ? {
                    ...latestPayslip, id:
                        latestPayslip._id.toString()
                } : null
            });
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
}