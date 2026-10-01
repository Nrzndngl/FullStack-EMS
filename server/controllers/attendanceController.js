import { inngest } from "../inngest/index.js";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import { nepalNowTime, startOfNepalDay, nepalDateKey, dayRangeForDateKey } from "../utils/time.js";
import { recordAudit } from "../utils/audit.js";
import { queryId, queryDate, queryEnum } from "../validators/index.js";

// Coerce a raw time value to a valid Date, or report it as invalid.
// Returns { valid: true, value: Date } or { valid: false, reason: ... } when skipped.
const parseTime = (value, label) => {
    if (value === undefined || value === null || value === "") return { valid: true, value: null };
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { valid: false, value: null, reason: `Invalid ${label}` };
    return { valid: true, value: d };
};


// CLOCK IN/OUT FOR EMPLOYEE
export const clockInOut = async (req, res) => {
    try {
        const session = req.session;
        if (session.role === "ADMIN") {
            return res.status(400).json({ error: "Admins have no personal attendance record. Use GET /api/attendance/all." })
        }
        const employee = await Employee.findOne({ userId: session.userId })
        if (!employee) return res.status(404).json({ error: "No employee profile is linked to this account. Contact an administrator." })
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
            const nowTs = now.getTime();
            // Guard against legacy records with a null/missing checkIn so the
            // computed hours can never be NaN / explode into millions of hours.
            const checkInTime = existing.checkIn ? new Date(existing.checkIn).getTime() : nowTs;
            const diffHours = Math.max(0, (nowTs - checkInTime) / (1000 * 60 * 60));

            existing.checkOut = now;

            // COMPUTE WORKING HOURS & DAY TYPE (clamped to a sane 0-24h window)
            const workingHours = parseFloat(Math.min(24, diffHours).toFixed(2));
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
        if (session.role === "ADMIN") {
            return res.status(400).json({ error: "Admins have no personal attendance record. Use GET /api/attendance/all." })
        }
        const employee = await Employee.findOne({
            userId: session.userId
        })
        if (!employee) return res.status(404).json({
            error:
                "No employee profile is linked to this account. Contact an administrator."
        });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize) || 30));
        const where = { employeeId: employee._id };

        if (req.query.from || req.query.to) {
            const from = queryDate(req.query.from);
            const to = queryDate(req.query.to);
            if (req.query.from && !from) return res.status(400).json({ error: "Invalid from date" });
            if (req.query.to && !to) return res.status(400).json({ error: "Invalid to date" });
            if (from && to && from > to) return res.status(400).json({ error: "from cannot be after to" });
            where.date = {};
            if (from) where.date.$gte = dayRangeForDateKey(from).start;
            if (to) where.date.$lte = dayRangeForDateKey(to).end;
        }
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

        if (req.query.employeeId) {
            const employeeId = queryId(req.query.employeeId);
            if (!employeeId) return res.status(400).json({ error: "Invalid employeeId" });
            where.employeeId = employeeId;
        }
        if (req.query.status) {
            const status = queryEnum(req.query.status, ["PRESENT", "ABSENT", "LATE"]);
            if (!status) return res.status(400).json({ error: "Invalid status" });
            where.status = status;
        }
        if (req.query.from || req.query.to) {
            const from = queryDate(req.query.from);
            const to = queryDate(req.query.to);
            if (req.query.from && !from) return res.status(400).json({ error: "Invalid from date" });
            if (req.query.to && !to) return res.status(400).json({ error: "Invalid to date" });
            if (from && to && from > to) return res.status(400).json({ error: "from cannot be after to" });
            where.date = {};
            if (from) where.date.$gte = dayRangeForDateKey(from).start;
            if (to) where.date.$lte = dayRangeForDateKey(to).end;
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
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid attendance id" });
        }
        const { checkIn, checkOut, status, dayType } = req.body;

        // Validate anything the admin actually sent before mutating.
        for (const [value, label] of [[checkIn, "checkIn"], [checkOut, "checkOut"]]) {
            const parsed = parseTime(value, label);
            if (!parsed.valid) return res.status(400).json({ error: parsed.reason });
        }

        const record = await Attendance.findById(id);
        if (!record) return res.status(404).json({ error: "Attendance record not found" });

        if (checkIn !== undefined && checkIn !== null && checkIn !== "") {
            const parsed = new Date(checkIn);
            if (record.checkIn === null && record.status === "ABSENT") record.status = "PRESENT";
            record.checkIn = parsed;
        }
        if (checkOut !== undefined && checkOut !== null && checkOut !== "") {
            record.checkOut = new Date(checkOut);
        }
        if (status && ["PRESENT", "ABSENT", "LATE"].includes(status)) record.status = status;
        if (dayType && ["Full Day", "Three Quarter Day", "Half Day", "Short Day"].includes(dayType)) record.dayType = dayType;

        // Recompute working hours + overtime + day type whenever both times exist.
        // Null checkIn can never produce NaN: fall back to 0 hours.
        if (record.checkIn && record.checkOut) {
            const diffMs = Math.max(0, new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime());
            const hours = Math.min(24, diffMs / (1000 * 60 * 60));
            record.workingHours = parseFloat(hours.toFixed(2));
            const STANDARD_HOURS = 8;
            record.overtimeHours = record.workingHours > STANDARD_HOURS
                ? parseFloat((record.workingHours - STANDARD_HOURS).toFixed(2))
                : 0;

            if (!dayType || !["Full Day", "Three Quarter Day", "Half Day", "Short Day"].includes(dayType)) {
                let computed = "Short Day";
                if (record.workingHours >= 8) computed = "Full Day";
                else if (record.workingHours >= 6) computed = "Three Quarter Day";
                else if (record.workingHours >= 4) computed = "Half Day";
                record.dayType = computed;
            }
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