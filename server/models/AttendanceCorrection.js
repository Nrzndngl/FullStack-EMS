import mongoose from "mongoose";

const attendanceCorrectionSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    checkIn: {
        type: Date,
        default: null,
    },
    checkOut: {
        type: Date,
        default: null,
    },
    reason: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
    },
    adminNote: {
        type: String,
        default: "",
    },
}, { timestamps: true });

attendanceCorrectionSchema.index({ employeeId: 1, createdAt: -1 });
attendanceCorrectionSchema.index({ status: 1, createdAt: -1 });

const AttendanceCorrection = mongoose.models.AttendanceCorrection
    || mongoose.model("AttendanceCorrection", attendanceCorrectionSchema);

export default AttendanceCorrection;