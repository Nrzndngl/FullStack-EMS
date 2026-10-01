import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized No token found" })
        }
        const token = authHeader.split(" ")[1];
        let session;
        try {
            session = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        } catch {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!session || session.typ !== "access") {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Re-read the user from the DB so deactivated accounts, demoted roles
        // and revoked token versions are rejected immediately (not at expiry).
        const user = await User.findById(session.userId)
            .select("role isActive tokenVersion name email");
        if (!user || !user.isActive) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (session.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Block soft-deleted employees from the whole API.
        if (user.role === "EMPLOYEE") {
            const employee = await Employee.findOne({ userId: user._id }).select("isDeleted").lean();
            if (employee?.isDeleted) {
                return res.status(401).json({ error: "Unauthorized" });
            }
        }

        req.session = { ...session, role: user.role };
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized" })
    }
}

export const protectAdmin = (req, res, next) => {
    if (req?.session?.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized as Admin" })
    }
    next();
}