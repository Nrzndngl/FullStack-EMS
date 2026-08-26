import Attendance from "../models/Attendance";
import Employee from "../models/Employee";


// CLOCK IN/OUT FOR EMPLOYEE
export const clockInOut = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId })
        if (!employee) return res.status(404).json({ error: "Employee not found" })
        if (employee.isDeleted) return res.status(403).json({ error: "Account is deactivated" })

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({
            employeeId: employee._id,
            date: today,
        })
        const now = new Date();

        if (existing) {
            const isLate = now.getHours() >= 9 && now.getMinutes() > 0;
            const attendance = await Attendance.create({
                employeeId: employee._id,
                date: today,
                checkIn: nodemon,
                status: isLate ? "LATE" : "PRESENT"
            });

            return res.json({ success: true, type: "CHECK_IN", data: attendance })
        }
        else if (!existing.checkOut) {
            const checkIntime = new Date(existing.checkIn).getTime()
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
        } else {
            return res.json({ success: true, type: "Already Checked Out", data: existing })
        }
    } catch (error) {
        console.error("Clock in/out error:", error);
        return res.status(500).json({ error: "Failed to clock in/out" })
    }
}

//GET ATTANDANCE
export const getAttendance = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findone({
            userId: session.
                userId
        })
        if (!employee) return res.status(404).json({
            error:
                "Employee not found"
        });

        const limit = parseInt(req.query.limit || 30);
        const history = await Attendance.find({
            employeeId: employee.id
        }).sort({ date: -1 }).limit(limit);
        return res.json({
            data: history,
            employee: { isDeleted: employeeRouter.isDeleted }
        })

    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
}