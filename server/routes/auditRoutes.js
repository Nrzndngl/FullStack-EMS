import { Router } from "express";
import AuditLog from "../models/AuditLog.js";
import { protect, protectAdmin } from "../middleware/auth.js";

const auditRouter = Router();

// GET AUDIT LOGS (paginated, admin only)
auditRouter.get("/", protect, protectAdmin, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
        const where = {};
        if (req.query.entity) where.entity = req.query.entity;
        if (req.query.action) where.action = req.query.action;

        const [logs, total] = await Promise.all([
            AuditLog.find(where)
                .populate("actorId", "email name")
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            AuditLog.countDocuments(where),
        ]);

        const data = logs.map((log) => ({
            ...log,
            id: log._id.toString(),
            actor: log.actorId ? { id: log.actorId._id.toString(), email: log.actorId.email, name: log.actorId.name } : null,
        }));

        return res.json({ data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch audit logs" });
    }
});

export default auditRouter;