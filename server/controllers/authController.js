import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../config/nodemailer.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

const refreshSecret = () => process.env.JWT_REFRESH_SECRET;

const buildPayload = (user) => ({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name || "",
});

const signAccessToken = (user) =>
    jwt.sign(
        { ...buildPayload(user), typ: "access", tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TTL, algorithm: "HS256" }
    );

const signRefreshToken = (user) => {
    const secret = refreshSecret();
    if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
    return jwt.sign(
        { userId: user._id.toString(), typ: "refresh", tokenVersion: user.tokenVersion },
        secret,
        { expiresIn: REFRESH_TTL, algorithm: "HS256" }
    );
};

const refreshCookieOptions = () => ({
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production" || process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: REFRESH_MS,
});

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

// LOGIN FOR EMPLOYEE AND ADMIN
export const login = async (req, res) => {
    try {
        const { email, password, role_type } = req.body;

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: "Your account is deactivated. Contact your administrator." });
        }
        if (role_type === "admin" && user.role !== "ADMIN") {
            return res.status(401).json({ error: "Not Authorized as Admin" });
        }
        if (role_type === "employee" && user.role !== "EMPLOYEE") {
            return res.status(401).json({ error: "Not Authorized as Employee" });
        }

        if (user.role === "EMPLOYEE") {
            const employee = await Employee.findOne({ userId: user._id }).select("isDeleted").lean();
            if (employee?.isDeleted) {
                return res.status(403).json({ error: "Your account is deactivated. Contact your administrator." });
            }
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        res.cookie("refreshToken", refreshToken, refreshCookieOptions());
        return res.json({ user: buildPayload(user), token: accessToken });
    } catch (error) {
        console.error("Login error:", error);
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
        const secret = refreshSecret();
        if (!secret) return res.status(401).json({ error: "Unauthorized" });

        let payload;
        try {
            payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
        } catch {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (payload.typ !== "refresh") {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await User.findById(payload.userId).select("role isActive tokenVersion name email");
        if (!user || !user.isActive) return res.status(401).json({ error: "Unauthorized" });
        if (user.tokenVersion !== payload.tokenVersion) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);
        res.cookie("refreshToken", refreshToken, refreshCookieOptions());

        return res.json({ user: buildPayload(user), token: accessToken });
    } catch (error) {
        return res.status(500).json({ error: "Refresh failed" });
    }
}

// LOGOUT: CLEAR REFRESH COOKIE AND BUMP TOKEN VERSION SO ALL EXISTING TOKENS DIE
export const logout = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            const secret = refreshSecret();
            if (secret) {
                try {
                    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
                    if (payload?.userId) {
                        await User.updateOne({ _id: payload.userId }, { $inc: { tokenVersion: 1 } });
                    }
                } catch {
                    // Invalid/expired cookie - nothing to revoke
                }
            }
        }
        res.clearCookie("refreshToken", { ...refreshCookieOptions(), maxAge: undefined });
        return res.json({ success: true });
    } catch (error) {
        res.clearCookie("refreshToken", { ...refreshCookieOptions(), maxAge: undefined });
        return res.json({ success: true });
    }
}

// GET SESSION FOR EMPLOYEE AND ADMIN (authoritative, straight from the DB)
export const session = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select("role name email");
        if (!user) return res.status(401).json({ error: "Unauthorized" });

        const employee = await Employee.findOne({ userId: user._id }).select("image").lean();
        return res.json({
            user: {
                userId: user._id.toString(),
                role: user.role,
                email: user.email,
                name: user.name || "",
                photo: employee?.image || "",
            },
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to load session" });
    }
}

// CHANGE PASSWORD: VERIFY, ROTATE, REVOKE OLD TOKENS, RE-ISSUE NEW ONES
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId).select("+password role name email tokenVersion isActive");
        if (!user) return res.status(404).json({ error: "User not found" })
        if (!user.isActive) return res.status(403).json({ error: "Your account is deactivated." })

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return res.status(401).json({ error: "Invalid credentials" })

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: "New password must be different from the current password" })
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ _id: user._id }, { password: hashed, $inc: { tokenVersion: 1 } });

        const fresh = await User.findById(user._id).select("role isActive tokenVersion name email");
        const accessToken = signAccessToken(fresh);
        const refreshToken = signRefreshToken(fresh);
        res.cookie("refreshToken", refreshToken, refreshCookieOptions());

        return res.json({ success: true, token: accessToken, user: buildPayload(fresh) })
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ error: "Change password failed" })
    }
}

// FORGOT PASSWORD: EMAIL A ONE-TIME RESET TOKEN (hashed at rest)
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

        await User.updateOne(user._id, {
            resetPasswordToken: sha256(token),
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
                // Revoke the token but still return the generic message - the
                // token must NOT be handed back to the caller.
                await User.updateOne(user._id, { resetPasswordToken: null, resetPasswordExpires: null });
            }
        } else {
            console.warn("SMTP is not configured; password reset emails are not being sent.");
        }

        return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    }
}

// RESET PASSWORD WITH A VALID TOKEN
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: sha256(token),
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired reset token" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updateOne(user._id, {
            password: hashed,
            resetPasswordToken: null,
            resetPasswordExpires: null,
            $inc: { tokenVersion: 1 },
        });

        return res.json({ success: true, message: "Password updated. You can now log in." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ error: "Failed to reset password" });
    }
}