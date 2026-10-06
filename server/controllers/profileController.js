import Employee from "../models/Employee.js";
import mongoose from "mongoose";
import User from "../models/User.js";


// GET PROFILE
export const getProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({
            userId: session.userId
        })

        if (!employee) {
            return res.json({
                firstName: "Admin",
                lastName: "",
                email: session.email,
            })
        }
        return res.json(employee)
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch profile" })

    }
}

//UPDATE PROFILE
export const updateProfile = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId })
        if (!employee) {
            // Administrators without a linked Employee record have no persistable
            // profile; accept the update as a no-op so the UI does not 404.
            if (session.role === "ADMIN") return res.json({ success: true });
            return res.status(404).json({ error: "No employee profile is linked to this account. Contact an administrator" })
        }
        if (employee.isDeleted) {
            return res.status(403).json({ error: "Your Account is Deactivated. You cannot update your profile", })
        }
        const updates = {};
        if (typeof req.body.bio === "string") updates.bio = req.body.bio;
        if (typeof req.body.image === "string") updates.image = req.body.image;

        await Employee.findByIdAndUpdate(employee._id, updates)
        return res.json({ success: true })
    } catch (error) {
        return res.status(500).json({ error: "Failed to update profile" })
    }
}

// GET A PUBLIC EMPLOYEE PROFILE BY ID (own data for the logged-in user, otherwise admin-only via /api/employees/:id)
export const getProfileByEmployeeId = async (req, res) => {
    try {
        const { id } = req.params;
        const session = req.session;
        const isAdmin = session?.role === "ADMIN";
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ error: "Invalid employee id" });
        }
        const employee = await Employee.findById(id).populate("userId", "email role").lean();
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        // Non-admins may only view their own profile
        if (!isAdmin) {
            const own = await Employee.findOne({ userId: session.userId }).lean();
            if (!own || own._id.toString() !== id) {
                return res.status(403).json({ error: "Not authorized" });
            }
        }

        return res.json({ ...employee, id: employee._id.toString(), user: employee.userId });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
}

// GET ADMIN PROFILE DATA (name/email from User, employee record if any)
export const getAdminProfile = async (req, res) => {
    try {
        const session = req.session;
        const user = await User.findById(session.userId).lean();
        if (!user) return res.status(404).json({ error: "User not found" });
        const employee = await Employee.findOne({ userId: user._id }).lean();
        return res.json({
            name: user.name || user.email,
            email: user.email,
            employee: employee ? { ...employee, id: employee._id.toString() } : null,
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch admin profile" });
    }
}