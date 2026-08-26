import Employee from "../models/Employee.js";
import bcrypt from "bcrypt"
import User from "../models/User.js";


// GET EMPLOYEE
export const getEmployees = async (req, res) => {
    try {
        const { department } = req.query;
        const where = {};
        if (department) {
            where.department = department;
        }
        const employees = (await Employee.find(where)).toSorted
            ({ createdAt: -1 }).populate("userId", "email role").lean();

        const result = employees.map((emp) => ({
            ...emp,
            user: emp.userId ? { email: emp.userId.email, role: emp.userId.role } : null

        }))
        return res.json(result)

    } catch (error) {
        return res.status(500).json({ message: "internal server error" })
    }
}

//CREATE EMPLOYEE

export const createEmployee = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, department, position, basicSalary, allowances, deductions, joinDate, password, role, bio } = req.body;
        //Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: "email, password, first name, last name are required" });
        }

        const hashed = await bcrypt.hash(password, 10)
        const user = await User.create({
            email,
            password: hashed,
            role: role || "EMPLOYEE"
        })

        constemployee = await Employee.create({
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
            joinDate: new Date(joinDate),
            bio: bio || ""
        })
        res.status(201).json({ success: true, employee })

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
        const { firstName, lastName, email, phone, department, position, basicSalary, allowances, deductions, password, role, bio, employmentStatus } = req.body;
        //Validation
        const employee = await Employee.findById(id)
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" })
        }

        await Employee.findByIdAndUpdate(id, {
            firstName,
            lastName,
            email,
            phone,
            position,
            department: department || "Engineering",
            basicSalary: Number(basicSalary) || 0,
            allowances: Number(allowances) || 0,
            deductions: Number(deductions) || 0,
            employmentStatus: employmentStatus || "ACTIVE",
            bio: bio || ""
        })

        //UPDATE USER RECORD
        const userUpdate = { email }
        if (role) userUpdate.role = role;
        if (password) userUpdate.password = await bcrypt.hash(password, 10);

        await User.findByIdAndUpdate(employee.userId, userUpdate)


        return res.json({ success: true, employee })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email already exists" })
        }
        return res.status(500).json({ error: "Failed to create employee" })

    }
}

// DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" })
        }
        employee.isDeleted = true;
        employee.employmentStatus = "INACTIVE";
        await employee.save()

        return res.json({ success: true })

    } catch (error) {
        return res.status(500).json({ error: "IFailed to delete employee" })
    }
}
