import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const buildPayload = (user) => ({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name || "",
});

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

        const payload = buildPayload(user);
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

        const session = buildPayload(user);
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
export const session = (req, res) => {
    const session = req.session;
    return res.json({ user: session })
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