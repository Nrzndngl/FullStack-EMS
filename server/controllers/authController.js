import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../config/nodemailer.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const buildPayload = async (user) => {
    const employee = await Employee.findOne({ userId: user._id }).select("image").lean();
    return {
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name || "",
        photo: employee?.image || "",
    };
};

const refreshCookieOptions = () => ({
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFRESH_MS,
});

// LOGIN FOR EMPLOYEE AND ADMIN
export const login = async (req, res) => {
    try {
        const { email, password, role_type } = req.body;

        const user = await User.findOne({ email });
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

        const payload = await buildPayload(user);
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
        const refreshToken = jwt.sign({ userId: user._id.toString() }, refreshSecret(), { expiresIn: REFRESH_TTL });

        res.cookie("refreshToken", refreshToken, refreshCookieOptions());
        return res.json({ user: payload, token: accessToken });
    } catch (error) {
        console.log("Login error:", error);
        return res.status(500).json({ error: "Login Failed" })
    }
}

// EXCHANGE VALID REFRESH TOKEN FOR A FRESH ACCESS TOKEN
export const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        let payload;
        try {
            payload = jwt.verify(token, refreshSecret());
        } catch {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await User.findById(payload.userId);
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const session = await buildPayload(user);
        const accessToken = jwt.sign(session, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
        // Rotate the refresh token
        const refreshToken = jwt.sign({ userId: user._id.toString() }, refreshSecret(), { expiresIn: REFRESH_TTL });
        res.cookie("refreshToken", refreshToken, refreshCookieOptions());

        return res.json({ user: session, token: accessToken });
    } catch (error) {
        return res.status(500).json({ error: "Refresh failed" });
    }
}

// LOGOUT: CLEAR REFRESH COOKIE
export const logout = (req, res) => {
    res.clearCookie("refreshToken", { ...refreshCookieOptions(), maxAge: undefined });
    return res.json({ success: true });
}

// GET SESSION FOR EMPLOYEE AND ADMIN
export const session = async (req, res) => {
    const session = req.session;
    const employee = await Employee.findOne({ userId: session.userId }).select("image").lean();
    return res.json({ user: { ...session, photo: employee?.image || "" } });
}

// CHANGE PASSWORD FOR EMPLOYEE AND ADMIN
export const changePassword = async (req, res) => {
    try {
        const session = req.session;
        const { currentPassword, newPassword } = req.body;
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

// FORGOT PASSWORD: EMAIL A ONE-TIME RESET TOKEN
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        // Always respond the same way to avoid leaking which emails exist
        if (!user) {
            return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await User.findByIdAndUpdate(user._id, {
            resetPasswordToken: token,
            resetPasswordExpires: expiresAt,
        });

        const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;

        if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SENDER_EMAIL) {
            try {
                await sendEmail({
                    to: user.email,
                    subject: "Reset your QuickEMS password",
                    body: `
                        <div style="max-width: 600px; font-family: Arial, sans-serif;">
                            <h2>Password Reset Request</h2>
                            <p>Hi ${user.name || "there"},</p>
                            <p>We received a request to reset your QuickEMS password.</p>
                            <p>Click the link below to set a new password. This link expires in 1 hour.</p>
                            <p><a href="${resetUrl}" style="display:inline-block; padding:12px 24px; background:#4f46e5; color:#fff; text-decoration:none; border-radius:8px;">Reset Password</a></p>
                            <p>If you didn't request this, you can safely ignore this email.</p>
                            <br/>
                            <p>Best Regards,<br/>QuickEMS Team</p>
                        </div>
                    `,
                });
            } catch (err) {
                console.error("Forgot password email error:", err);
                await User.findByIdAndUpdate(user._id, { resetPasswordToken: null, resetPasswordExpires: null });
                return res.status(500).json({ error: "Failed to send reset email. Please try again." });
            }
        } else {
            // Dev fallback when SMTP isn't configured: return the reset token directly
            return res.json({ success: true, message: "Reset link generated.", devToken: token });
        }

        return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ error: "Failed to process request" });
    }
}

// RESET PASSWORD WITH A VALID TOKEN
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(user._id, {
            password: hashed,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });

        return res.json({ success: true, message: "Password updated. You can now log in." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ error: "Failed to reset password" });
    }
}