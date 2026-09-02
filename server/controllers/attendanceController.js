import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import { nepalNowTime, startOfNepalDay } from "../utils/time.js";


// CLOCK IN/OUT FOR EMPLOYEE
export const clockInOut = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId })
        if (!employee) return res.status(404).json({ error: "Employee not found" })
        if (employee.isDeleted) return res.status(403).json({ error: "Account is deactivated" })

        const today = startOfNepalDay();

        const existing = await Attendance.findOne({
            employeeId: employee._id,
            date: today,
        })
        const now = new Date();

        // No record yet -> CHECK IN
        if (!existing) {
            // Nepal-aware late check (after 9:00 AM Asia/Kathmandu)
            const { hour, minute } = nepalNowTime();
            const isLate = hour > 9 || (hour === 9 && minute > 0);
            const attendance = await Attendance.create({
                employeeId: employee._id,
                date: today,
                checkIn: now,
                status: isLate ? "LATE" : "PRESENT"
            });

            await inngest.send({
                name: "employee/check-out",
                data: {
                    employeeId: employee._id,
                    attendanceId: attendance._id,
                },
            })

            return res.json({ success: true, type: "CHECK_IN", data: attendance })
        }

        // Record exists but no check-out -> CHECK OUT
        if (!existing.checkOut) {
            const checkInTime = new Date(existing.checkIn).getTime()
            const diffMs = now.getTime() - checkInTime;
            const diffHours = diffMs / (1000 * 60 * 60)

            existing.checkOut = now;

            // COMPUTE WORKING HOURS & DAY TYPE
            const workingHours = parseFloat(diffHours.toFixed(2));

            let dayType = "Half Day"
            if (workingHours >= 8) dayType = "Full Day"
            else if (workingHours >= 6) dayType = "Three Quarter Day"
            else if (workingHours >= 4) dayType = "Half Day"
            else dayType = "Short Day";

            existing.workingHours = workingHours;
            existing.dayType = dayType;

            await existing.save();
            return res.json({ success: true, type: "CHECK_OUT", data: existing })
        }

        return res.json({ success: true, type: "Already Checked Out", data: existing })
    } catch (error) {
        console.error("Clock in/out error:", error);
        return res.status(500).json({ error: "Failed to clock in/out" })
    }
}

//GET ATTENDANCE
export const getAttendance = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({
            userId: session.userId
        })
        if (!employee) return res.status(404).json({
            error:
                "Employee not found"
        });

        const limit = parseInt(req.query.limit || 30);
        const history = await Attendance.find({
            employeeId: employee._id
        }).sort({ date: -1 }).limit(limit);
        return res.json({
            data: history,
            employee: { isDeleted: employee.isDeleted }
        })

    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
}