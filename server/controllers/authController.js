import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// LOGIN FOR EMPLOYEE AND ADMIN
export const login = async (req, res) => {
    try {
        const { email, password, role_type } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email, password are required" })
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }
        if (role_type === "admin" && user.role !== "ADMIN") {
            return res.status(401).json({ error: "Not Authorized as Admin" });
        }
        if (role_type === "employee" && user.role !== "EMPLOYEE") {
            return res.status(401).json({ error: "Not Authorized as Employee" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }
        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
        }
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" })

        return res.json({ user: payload, token });

    } catch (error) {
        console.log("Login error:", error);
        return res.status(500).json({ error: "Login Failed" })
    }
}
// GET SESSION FOR EMPLOYEE AND ADMIN
export const session = (req, res) => {
    const session = req.session;
    return res.json({ user: session })
}

// CHANGE PASSWORD FOR EMPLOYEE AND ADMIN
export const changePassword = async (req, res) => {
    try {
        const session = req.session;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "New password must be at least 8 characters long" });
        }
        const user = await User.findById(session.userId)
        if (!user) return res.status(404).json({ error: "User not found" })

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return res.status(401).json({ error: "Invalid credentials" })

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(session.userId, { password: hashed });

        return res.json({ success: true })

    } catch (error) {
        return res.status(500).json({ error: "Change password failed" })
    }
}