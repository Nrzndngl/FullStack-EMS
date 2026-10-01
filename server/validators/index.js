import { z } from "zod";
import { DEPARTMENTS } from "../constants/departments.js";

// Core reusable primitives

const PASSWORD_MAX = 72; // bcrypt truncates past 72 bytes

export const idParam = () => z.string().refine((v) => /^[a-f\d]{24}$/i.test(v), {
    message: "Invalid id",
});

// Auth
export const loginSchema = z.object({
    email: z.string().trim().email("A valid email is required").max(254),
    password: z.string().min(1, "Password is required").max(PASSWORD_MAX),
    role_type: z.enum(["admin", "employee"]).optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required").max(PASSWORD_MAX),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(PASSWORD_MAX),
});

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email("A valid email is required").max(254),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required").max(128),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(PASSWORD_MAX),
});

// Employee
const employeeBase = {
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    email: z.string().trim().email("A valid email is required").max(254),
    phone: z.string().trim().regex(/^[0-9+\-() ]{6,20}$/, "A valid phone number is required"),
    department: z.enum(DEPARTMENTS, { errorMap: () => ({ message: "Invalid department" }) }),
    position: z.string().trim().min(1, "Position is required").max(120),
    basicSalary: z.coerce.number().min(0, "Basic salary cannot be negative").max(100_000_000).optional(),
    allowances: z.coerce.number().min(0).max(100_000_000).optional(),
    deductions: z.coerce.number().min(0).max(100_000_000).optional(),
    bio: z.string().trim().max(2000).optional(),
    image: z.string().max(3_000_000).optional(),
    employmentStatus: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
};

export const createEmployeeSchema = z.object({
    ...employeeBase,
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    email: z.string().trim().email("A valid email is required").max(254),
    password: z.string().min(8, "Password must be at least 8 characters").max(PASSWORD_MAX),
    joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Join date must be YYYY-MM-DD").optional(),
});

export const updateEmployeeSchema = z.object(employeeBase).partial().extend({
    password: z.string().min(8, "Password must be at least 8 characters").max(PASSWORD_MAX).optional(),
    joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Join date must be YYYY-MM-DD").optional(),
});

// Leave
export const createLeaveSchema = z.object({
    type: z.enum(["SICK", "CASUAL", "ANNUAL"], { errorMap: () => ({ message: "Invalid leave type" }) }),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD"),
    reason: z.string().trim().min(1, "Reason is required").max(2000),
});

export const updateLeaveStatusSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"], { errorMap: () => ({ message: "Invalid status" }) }),
});

// Payslip
export const createPayslipSchema = z.object({
    employeeId: idParam(),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2200),
    basicSalary: z.coerce.number().min(0).default(0),
    allowances: z.coerce.number().min(0).optional().default(0),
    deductions: z.coerce.number().min(0).optional().default(0),
    workingDays: z.coerce.number().int().min(0).max(31).optional(),
    overtimeHours: z.coerce.number().min(0).max(744).optional(),
});

export const batchPayslipSchema = z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2200),
});

// Profile
export const updateProfileSchema = z.object({
    bio: z.string().trim().max(2000).optional(),
    image: z.string().max(3_000_000).optional(),
});

// Announcements
export const createAnnouncementSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(200),
    body: z.string().trim().min(1, "Message is required").max(10000),
    pinned: z.boolean().optional().default(false),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

// Attendance corrections / admin overrides
export const correctionRequestSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    reason: z.string().trim().min(1, "Reason is required").max(1000),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Invalid time").optional(),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Invalid time").optional(),
});

export const attendanceOverrideSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    status: z.enum(["PRESENT", "ABSENT", "LATE"]),
    dayType: z.enum(["Full Day", "Three Quarter Day", "Half Day", "Short Day"]),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Invalid time").optional(),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "Invalid time").optional(),
});

export const correctionReviewSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    adminNote: z.string().trim().max(1000).optional(),
});

// Query param guards
export const queryId = (value) => (typeof value === "string" && /^[a-f\d]{24}$/i.test(value) ? value : undefined);
export const queryDate = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value || "") ? value : undefined);
export const queryEnum = (value, allowed) => (typeof value === "string" && allowed.includes(value) ? value : undefined);