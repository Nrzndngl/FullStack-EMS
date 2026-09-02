import mongoose from "mongoose";

const payslipSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    workingDays: { type: Number, default: null },
    overtimeHours: { type: Number, default: 0 },

}, { timestamps: true })

payslipSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true })
payslipSchema.index({ year: 1, month: 1 })
payslipSchema.index({ employeeId: 1, createdAt: -1 })

const Payslip = mongoose.models.Payslip || mongoose.model("Payslip", payslipSchema)

export default Payslip;