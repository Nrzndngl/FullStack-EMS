import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
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
}, { timestamps: true })

UserSchema.index({ role: 1 })

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;