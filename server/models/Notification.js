import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["LEAVE", "PAYSLIP", "ATTENDANCE", "EMPLOYEE", "SYSTEM", "ANNOUNCEMENT"],
        default: "SYSTEM",
    },
    read: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String,
        default: null,
    },
    entityId: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
    },
}, { timestamps: true })

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, createdAt: -1 })

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;