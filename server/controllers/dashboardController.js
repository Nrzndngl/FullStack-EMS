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
            const [totalEmployees, todayAttendance, pendingLeaves, departmentDistribution, recentAttendance] = await
                Promise.all([
                    Employee.countDocuments({ isDeleted: { $ne: true } }),
                    (async () => {
                        const { start, end } = nepalTodayRange();
                        return Attendance.countDocuments({ date: { $gte: start, $lt: end } });
                    })(),

                    LeaveApplication.countDocuments({ status: "PENDING" }),

                    // Department distribution
                    (async () => {
                        const groups = await Employee.aggregate([
                            { $match: { isDeleted: { $ne: true } } },
                            { $group: { _id: "$department", count: { $sum: 1 } } },
                        ]);
                        return groups.map((g) => ({ department: g._id, count: g.count }));
                    })(),

                    // Last 6 months attendance trend
                    (async () => {
                        const { year, month } = nepalYearMonth();
                        const months = [];
                        for (let i = 5; i >= 0; i--) {
                            const y = month - i <= 0 ? year - 1 : year;
                            const m = month - i <= 0 ? month - i + 12 : month - i;
                            const { start, end } = monthRangeForYearMonth(y, m);
                            months.push({ y, m, start, end });
                        }

                        const results = await Promise.all(
                            months.map(async ({ y, m, start, end }) => {
                                const all = await Attendance.countDocuments({ date: { $gte: start, $lt: end } });
                                const late = await Attendance.countDocuments({
                                    date: { $gte: start, $lt: end },
                                    status: "LATE",
                                });
                                return { year: y, month: m, present: all - late, late, total: all };
                            })
                        );
                        return results;
                    })(),
                ]);

            // Payroll totals
            const payroll = await Payslip.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBasic: { $sum: "$basicSalary" },
                        totalNet: { $sum: "$netSalary" },
                        totalOvertime: { $sum: { $ifNull: ["$overtimeHours", 0] } },
                    },
                },
            ]);
            const payrollTotals = payroll.length ? payroll[0] : { totalBasic: 0, totalNet: 0, totalOvertime: 0 };

            return res.json({
                role: "ADMIN",
                totalEmployees,
                totalDepartments: DEPARTMENTS.length,
                todayAttendance,
                pendingLeaves,
                departmentDistribution,
                attendanceTrend: recentAttendance,
                payroll: payrollTotals,
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