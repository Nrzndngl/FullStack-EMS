import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import { nepalNowTime, startOfNepalDay, nepalDateKey, dayRangeForDateKey } from "../utils/time.js";
import { recordAudit } from "../utils/audit.js";


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
            const STANDARD_HOURS = 8;
            const overtimeHours = workingHours > STANDARD_HOURS
                ? parseFloat((workingHours - STANDARD_HOURS).toFixed(2))
                : 0;

            let dayType = "Half Day"
            if (workingHours >= 8) dayType = "Full Day"
            else if (workingHours >= 6) dayType = "Three Quarter Day"
            else if (workingHours >= 4) dayType = "Half Day"
            else dayType = "Short Day";

            existing.workingHours = workingHours;
            existing.overtimeHours = overtimeHours;
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

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 30));
        const where = { employeeId: employee._id };
        const [history, total] = await Promise.all([
            Attendance.find(where).sort({ date: -1 }).skip((page - 1) * pageSize).limit(pageSize),
            Attendance.countDocuments(where),
        ]);
        return res.json({
            data: history,
            employee: { isDeleted: employee.isDeleted },
            page, pageSize, total, totalPages: Math.ceil(total / pageSize)
        })

    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
}

// ADMIN: GET ALL ATTENDANCE RECORDS (with optional date / employee filtering + pagination)
export const getAllAttendance = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
        const where = {};

        if (req.query.employeeId) where.employeeId = req.query.employeeId;
        if (req.query.status) where.status = req.query.status;
        if (req.query.from || req.query.to) {
            where.date = {};
            if (req.query.from) where.date.$gte = dayRangeForDateKey(req.query.from).start;
            if (req.query.to) where.date.$lte = dayRangeForDateKey(req.query.to).start;
        }

        const [records, total] = await Promise.all([
            Attendance.find(where)
                .populate("employeeId", "firstName lastName email department position")
                .sort({ date: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Attendance.countDocuments(where),
        ]);

        const data = records.map((r) => ({
            ...r,
            id: r._id.toString(),
            employee: r.employeeId,
            employeeId: r.employeeId?._id?.toString(),
        }));

        return res.json({ data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
}

// ADMIN: UPDATE / CORRECT A RECORDED ATTENDANCE ENTRY
export const correctAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, status, dayType } = req.body;

        const record = await Attendance.findById(id);
        if (!record) return res.status(404).json({ error: "Attendance record not found" });

        if (checkIn) record.checkIn = new Date(checkIn);
        if (checkOut) record.checkOut = new Date(checkOut);
        if (status) record.status = status;
        if (dayType) record.dayType = dayType;

        // Recompute working hours when both times are present
        if (record.checkIn && record.checkOut) {
            const diffMs = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
            const hours = diffMs / (1000 * 60 * 60);
            record.workingHours = Math.max(0, parseFloat(hours.toFixed(2)));
            const STANDARD_HOURS = 8;
            record.overtimeHours = record.workingHours > STANDARD_HOURS
                ? parseFloat((record.workingHours - STANDARD_HOURS).toFixed(2))
                : 0;
        }

        await record.save();

        await recordAudit({
            actorId: req.session.userId,
            action: "ATTENDANCE_CORRECT",
            entity: "ATTENDANCE",
            entityId: id,
            details: { date: nepalDateKey(record.date) },
        });

        return res.json({ success: true, data: record });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update attendance" });
    }
}