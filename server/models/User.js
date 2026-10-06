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
    // sha256 of the currently-issued refresh token. Refresh tokens are
    // rotated on every use, so a stolen token is rejected as soon as the
    // victim's real browser refreshes once.
    refreshTokenHash: {
        type: String,
        default: null,
        select: false,
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