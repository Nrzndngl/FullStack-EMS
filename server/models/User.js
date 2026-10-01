import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ["ADMIN", "EMPLOYEE"],
        default: "EMPLOYEE"
    },
    name: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
    resetPasswordToken: {
        type: String,
        default: null,
        index: true,
        select: false,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
}, { timestamps: true })

UserSchema.index({ role: 1 })

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;