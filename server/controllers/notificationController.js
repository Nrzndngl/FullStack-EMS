import Notification from "../models/Notification.js";

// SEND A NOTIFICATION TO A USER (non-blocking)
export const notifyUser = async ({ userId, title, message, type = "SYSTEM", link = null, entityId = null }) => {
    if (!userId) return;
    try {
        await Notification.create({ userId, title, message, type, link, entityId });
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};

// GET NOTIFICATIONS FOR CURRENT USER
export const getNotifications = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 15));
        const where = { userId: req.session.userId };
        const [notifications, total, unread] = await Promise.all([
            Notification.find(where).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
            Notification.countDocuments(where),
            Notification.countDocuments({ ...where, read: false }),
        ]);
        return res.json({
            data: notifications,
            unread,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

// MARK A SINGLE NOTIFICATION AS READ
export const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId: req.session.userId },
            { read: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ error: "Notification not found" });
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update notification" });
    }
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.session.userId, read: false },
            { read: true }
        );
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update notifications" });
    }
};