import AuditLog from "../models/AuditLog.js";

/** Non-blocking audit trail helper. Failures are logged, never thrown to callers. */
export const recordAudit = async ({ actorId, action, entity, entityId, details = {} }) => {
    if (!actorId) return;
    try {
        await AuditLog.create({ actorId, action, entity, entityId, details });
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
};