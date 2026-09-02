import mongoose from "mongoose";
import { DEPARTMENTS } from "../constants/departments.js";
import { LEAVE_ENTITLEMENTS } from "../constants/leave.js";

const employeeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    basicSalary: {
        type: Number,
        default: 0
    },
    allowances: {
        type: Number,
        default: 0
    },
    deductions: {
        type: Number,
        default: 0
    },
    employmentStatus: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE"
    },
    joinDate: {
        type: Date,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    bio: {
        type: String,
        default: ""
    },
    department: {
        type: String,
        enum: DEPARTMENTS,
        required: true

    },
    leaveBalance: {
        type: {
            CASUAL: { type: Number, default: LEAVE_ENTITLEMENTS.CASUAL },
            SICK: { type: Number, default: LEAVE_ENTITLEMENTS.SICK },
            ANNUAL: { type: Number, default: LEAVE_ENTITLEMENTS.ANNUAL },
        },
        default: () => ({ ...LEAVE_ENTITLEMENTS }),
    }
}, { timestamps: true })

employeeSchema.index({ email: 1 })
employeeSchema.index({ department: 1 })

const Employee = mongoose.models.Employee || mongoose.model("Employee", employeeSchema);

export default Employee;