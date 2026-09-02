import { z } from "zod";

// Core reusable primitives

export const idParam = () => z.string().refine((v) => /^[a-f\d]{24}$/i.test(v), {
    message: "Invalid id",
});

// Auth
export const loginSchema = z.object({
    email: z.string().trim().email("A valid email is required"),
    password: z.string().min(1, "Password is required"),
    role_type: z.enum(["admin", "employee"]).optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

// Employee
const employeeBase = {
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("A valid email is required"),
    phone: z.string().trim().optional(),
    department: z.string().trim().optional(),
    position: z.string().trim().optional(),
    basicSalary: z.coerce.number().min(0, "Basic salary cannot be negative").optional(),
    allowances: z.coerce.number().min(0).optional(),
    deductions: z.coerce.number().min(0).optional(),
    bio: z.string().trim().optional(),
    employmentStatus: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
};

export const createEmployeeSchema = z.object({
    ...employeeBase,
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z.string().trim().email("A valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    joinDate: z.string().optional(),
});

export const updateEmployeeSchema = z.object(employeeBase).partial();

// Leave
export const createLeaveSchema = z.object({
    type: z.enum(["SICK", "CASUAL", "ANNUAL"], { errorMap: () => ({ message: "Invalid leave type" }) }),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(1, "Reason is required"),
});

export const updateLeaveStatusSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED", "PENDING"], { errorMap: () => ({ message: "Invalid status" }) }),
});

// Payslip
export const createPayslipSchema = z.object({
    employeeId: idParam(),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2200),
    basicSalary: z.coerce.number().min(0).default(0),
    allowances: z.coerce.number().min(0).optional().default(0),
    deductions: z.coerce.number().min(0).optional().default(0),
    workingDays: z.coerce.number().int().min(0).optional(),
    overtimeHours: z.coerce.number().min(0).optional(),
});

// Profile
export const updateProfileSchema = z.object({
    bio: z.string().trim().max(2000).optional(),
});