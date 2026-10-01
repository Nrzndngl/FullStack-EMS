import Attendance from "../models/Attendance.js";
import mongoose from "mongoose";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import AttendanceCorrection from "../models/AttendanceCorrection.js";
import { nepalDateKey, startOfNepalDay, dayRangeForDateKey } from "../utils/time.js";
import { recordAudit } from "../utils/audit.js";
import { notifyUser } from "./notificationController.js";

const STATUS_LABEL = {
    APPROVED: "approved",
    REJECTED: "rejected",
};

const recomputeHours = (record) => {
    const start = record.checkIn ? new Date(record.checkIn).getTime() : null;
    const end = record.checkOut ? new Date(record.checkOut).getTime() : null;
    if (start != null && end != null && !Number.isNaN(start) && !Number.isNaN(end)) {
        const hours = Math.min(24, Math.max(0, (end - start) / (1000 * 60 * 60)));
        record.workingHours = parseFloat(hours.toFixed(2));
        const STANDARD_HOURS = 8;
        record.overtimeHours = record.workingHours > STANDARD_HOURS
            ? parseFloat((record.workingHours - STANDARD_HOURS).toFixed(2))
            : 0;
    }
    return record;
};

// EMPLOYEE: REQUEST AN ATTENDANCE CORRECTION FOR A PAST DAY
export const createCorrectionRequest = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) {
            return res.status(403).json({ error: "Your account is deactivated. You cannot request corrections." });
        }

        const { date, checkIn, checkOut, reason } = req.body;
        if (!date || !reason?.trim()) {
            return res.status(400).json({ error: "Date and reason are required" });
        }

        // Reject invalid dates/times instead of persisting Invalid Date objects
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: "Invalid date" });
        }
        for (const [value, label] of [[checkIn, "checkIn"], [checkOut, "checkOut"]]) {
            if (value !== undefined && value !== null && value !== "") {
                const t = new Date(value);
                if (Number.isNaN(t.getTime())) return res.status(400).json({ error: `Invalid ${label}` });
            }
        }

        // Normalize to a Nepal calendar date; only past days can be corrected
        const dateKey = nepalDateKey(parsedDate);
        if (dateKey >= nepalDateKey()) {
            return res.status(400).json({ error: "You can only request corrections for past days" });
        }

        // A pending request for the same day blocks duplicates
        const existingPending = await AttendanceCorrection.findOne({
            employeeId: employee._id,
            date: { $gte: dayRangeForDateKey(dateKey).start, $lt: dayRangeForDateKey(dateKey).end },
            status: "PENDING",
        });
        if (existingPending) {
            return res.status(400).json({ error: "You already have a pending correction request for this date" });
        }

        // If a regular attendance record already exists, canonical corrections go through the admin flow
        const existingAttendance = await Attendance.findOne({
            employeeId: employee._id,
            date: { $gte: dayRangeForDateKey(dateKey).start, $lt: dayRangeForDateKey(dateKey).end },
        });
        if (existingAttendance) {
            return res.status(400).json({
                error: "You already have an attendance record for this date. Contact your admin to correct it.",
            });
        }

        const request = await AttendanceCorrection.create({
            employeeId: employee._id,
            date: startOfNepalDay(parsedDate),
            checkIn: checkIn ? new Date(checkIn) : null,
            checkOut: checkOut ? new Date(checkOut) : null,
            reason: reason.trim(),
        });

        // Notify admins about the pending request
        const admins = await User.find({ role: "ADMIN" }).select("_id").lean();
        const adminIds = admins.map((a) => a._id.toString());
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        await Promise.all(admins.map((adminId) =>
            notifyUser({
                userId: adminId,
                title: "New attendance correction request",
                message: `${employeeName} requested a correction for ${dateKey}: ${reason.trim().slice(0, 80)}`,
                type: "ATTENDANCE",
                link: "/attendance",
                entityId: request._id,
            })
        ));

        return res.json({ success: true, data: request });
    } catch (error) {
        return res.status(500).json({ error: "Failed to submit correction request" });
    }
};

// EMPLOYEE: LIST OWN CORRECTION REQUESTS
export const getMyCorrectionRequests = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const where = { employeeId: employee._id };
        const [requests, total] = await Promise.all([
            AttendanceCorrection.find(where).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
            AttendanceCorrection.countDocuments(where),
        ]);

        const data = requests.map((r) => ({ ...r.toObject(), id: r._id.toString() }));
        return res.json({ data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch correction requests" });
    }
};

// ADMIN: LIST ALL CORRECTION REQUESTS (optional status filter + pagination)
export const getAllCorrectionRequests = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const where = {};
        if (["PENDING", "APPROVED", "REJECTED"].includes(req.query.status)) where.status = req.query.status;

        const [requests, total] = await Promise.all([
            AttendanceCorrection.find(where)
                .populate("employeeId", "firstName lastName email department position")
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            AttendanceCorrection.countDocuments(where),
        ]);

        const data = requests.map((r) => ({
            ...r,
            id: r._id.toString(),
            employee: r.employeeId,
            employeeId: r.employeeId?._id?.toString(),
        }));
        return res.json({ data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch correction requests" });
    }
};

// ADMIN: APPROVE / REJECT A CORRECTION REQUEST (approval upserts the attendance record)
export const reviewCorrectionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid correction request id" });
        }

        const request = await AttendanceCorrection.findById(id).populate("employeeId");
        if (!request) return res.status(404).json({ error: "Correction request not found" });
        if (request.status !== "PENDING") {
            return res.status(400).json({ error: "This request has already been reviewed" });
        }
        if (!["APPROVED", "REJECTED"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        request.status = status;
        if (typeof adminNote === "string") request.adminNote = adminNote.trim();
        await request.save();

        let attendanceNote = "";
        if (status === "APPROVED") {
            const { start, end } = dayRangeForDateKey(nepalDateKey(request.date));
            let record = await Attendance.findOne({
                employeeId: request.employeeId._id,
                date: { $gte: start, $lt: end },
            });

            if (!record) {
                record = await Attendance.create({
                    employeeId: request.employeeId._id,
                    date: start,
                    status: "PRESENT",
                });
            }

            // Apply the requested timing and mark it as corrected
            if (request.checkIn) record.checkIn = new Date(request.checkIn);
            if (request.checkOut) record.checkOut = new Date(request.checkOut);
            record.status = record.status === "ABSENT" ? "PRESENT" : record.status || "PRESENT";
            recomputeHours(record);
            await record.save();
            attendanceNote = " and your attendance record was updated";
        }

        await recordAudit({
            actorId: req.session.userId,
            action: "ATTENDANCE_CORRECTION_REVIEW",
            entity: "ATTENDANCE_CORRECTION",
            entityId: request._id,
            details: { status, date: nepalDateKey(request.date) },
        });

        // Notify the employee
        const employee = request.employeeId;
        await notifyUser({
            userId: employee.userId,
            title: `Correction request ${status.toLowerCase()}`,
            message: `Your correction request for ${nepalDateKey(request.date)} was ${status.toLowerCase()}${attendanceNote}.`,
            type: "ATTENDANCE",
            link: "/attendance",
            entityId: request._id,
        });

        return res.json({ success: true, data: request });
    } catch (error) {
        return res.status(500).json({ error: "Failed to review correction request" });
    }
};