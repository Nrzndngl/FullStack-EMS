import Employee from "../models/Employee.js";
import bcrypt from "bcrypt"
import mongoose from "mongoose";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";
import { recordAudit } from "../utils/audit.js";
import { nepalDateKey } from "../utils/time.js";

// GET EMPLOYEES (paginated, admin only)
export const getEmployees = async (req, res) => {
    try {
        const { department } = req.query;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 12));
        const where = { isDeleted: { $ne: true } };
        if (typeof department === "string" && department) {
            where.department = department;
        }

        // Server-side search so results are not limited to the loaded page.
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
        if (search.length >= 1) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const pattern = new RegExp(escaped, "i");
            where.$or = [
                { firstName: pattern },
                { lastName: pattern },
                { email: pattern },
                { position: pattern },
            ];
        }

        const [employees, total] = await Promise.all([
            Employee.find(where).sort
                ({ createdAt: -1 }).populate("userId", "email role").skip((page - 1) * pageSize).limit(pageSize).lean(),
            Employee.countDocuments(where),
        ]);

        const result = employees.map((emp) => ({
            ...emp,
            id: emp._id.toString(),
            user: emp.userId ? { email: emp.userId.email, role: emp.userId.role } : null

        }))
        return res.json({ data: result, page, pageSize, total, totalPages: Math.ceil(total / pageSize) })

    } catch (error) {
        return res.status(500).json({ message: "internal server error" })
    }
}

// GET SINGLE EMPLOYEE WITH SUMMARY (admin only)
export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid employee id" });
        }
        const employee = await Employee.findById(id).populate("userId", "email role").lean();
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const [attendanceCount, leaveCount, pendingLeaves, payslipCount, latestPayslip] = await Promise.all([
            Attendance.countDocuments({ employeeId: employee._id }),
            LeaveApplication.countDocuments({ employeeId: employee._id }),
            LeaveApplication.countDocuments({ employeeId: employee._id, status: "PENDING" }),
            Payslip.countDocuments({ employeeId: employee._id }),
            Payslip.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean(),
        ]);

        return res.json({
            ...employee,
            id: employee._id.toString(),
            user: employee.userId ? { email: employee.userId.email, role: employee.userId.role } : null,
            attendanceCount,
            leaveCount,
            pendingLeaves,
            payslipCount,
            latestPayslip,
            todayNepalDate: nepalDateKey(),
        });

    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch employee" })
    }
}

//CREATE EMPLOYEE

export const createEmployee = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, department, position, basicSalary, allowances, deductions, joinDate, password, role, bio, image } = req.body;
        //Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: "email, password, first name, last name are required" });
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({
            email,
            password: hashed,
            role: role || "EMPLOYEE",
            name: `${firstName} ${lastName}`.trim()
        })

        let createdUserId = null;
        try {
            const employee = await Employee.create({
                userId: user._id,
                firstName,
                lastName,
                email,
                phone,
                position,
                department: department || "Engineering",
                basicSalary: Number(basicSalary) || 0,
                allowances: Number(allowances) || 0,
                deductions: Number(deductions) || 0,
                joinDate: joinDate ? new Date(joinDate) : new Date(),
                bio: bio || "",
                image: image || ""
            })
        } catch (employeeError) {
            // Roll back the User we just created so we don't leave an orphaned
            // login that can never sign in (no matching Employee row).
            await User.findByIdAndDelete(user._id).catch(() => {});
            throw employeeError;
        }
        res.status(201).json({ success: true, employee: employee.toObject() })

        await recordAudit({
            actorId: req.session.userId,
            action: "CREATE",
            entity: "EMPLOYEE",
            entityId: employee._id,
            details: { email, role: role || "EMPLOYEE" },
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email already exists" })
        }
        console.error("Create employee error:", error)
        return res.status(500).json({ error: "Failed to create employee" })

    }
}

// UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid employee id" });
        }

        const { firstName, lastName, email, phone, department, position, basicSalary, allowances, deductions, password, role, bio, employmentStatus, image, joinDate } = req.body;

        const employee = await Employee.findById(id)
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" })
        }

        // Only touch the fields that were actually provided. Using `|| 0`
        // defaults here would silently zero salaries or reset departments.
        const fields = {};
        if (firstName !== undefined) fields.firstName = firstName;
        if (lastName !== undefined) fields.lastName = lastName;
        if (email !== undefined) fields.email = email;
        if (phone !== undefined) fields.phone = phone;
        if (position !== undefined) fields.position = position;
        if (department !== undefined) fields.department = department;
        if (basicSalary !== undefined) fields.basicSalary = Number(basicSalary) || 0;
        if (allowances !== undefined) fields.allowances = Number(allowances) || 0;
        if (deductions !== undefined) fields.deductions = Number(deductions) || 0;
        if (employmentStatus !== undefined) fields.employmentStatus = employmentStatus;
        if (bio !== undefined) fields.bio = bio;
        if (image !== undefined) fields.image = image;
        if (joinDate !== undefined) fields.joinDate = new Date(joinDate);

        if (Object.keys(fields).length) {
            await Employee.findByIdAndUpdate(id, { $set: fields });
        }

        // UPDATE USER RECORD
        const userUpdate = {};
        if (email !== undefined) userUpdate.email = email;
        if (role !== undefined) userUpdate.role = role;
        if (password) userUpdate.password = await bcrypt.hash(password, 10);
        if (firstName !== undefined || lastName !== undefined) userUpdate.name = `${firstName ?? employee.firstName} ${lastName ?? employee.lastName}`.trim();

        if (Object.keys(userUpdate).length) {
            await User.findByIdAndUpdate(employee.userId, { $set: userUpdate });
        }

        const updated = await Employee.findById(id).lean();

        await recordAudit({
            actorId: req.session.userId,
            action: "UPDATE",
            entity: "EMPLOYEE",
            entityId: id,
            details: { email: updated?.email },
        });

        return res.json({ success: true, employee: { ...updated, id: updated._id.toString() } })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email already exists" })
        }
        return res.status(500).json({ error: "Failed to update employee" })

    }
}

// DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid employee id" });
        }
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" })
        }
        employee.isDeleted = true;
        employee.employmentStatus = "INACTIVE";
        await employee.save()

        await recordAudit({
            actorId: req.session.userId,
            action: "DELETE",
            entity: "EMPLOYEE",
            entityId: id,
        });

        return res.json({ success: true })

    } catch (error) {
        return res.status(500).json({ error: "Failed to delete employee" })
    }
}