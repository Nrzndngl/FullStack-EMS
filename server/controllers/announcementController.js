import Announcement from "../models/Announcement.js";
import User from "../models/User.js";
import { recordAudit } from "../utils/audit.js";
import { notifyUser } from "./notificationController.js";
import mongoose from "mongoose";

const validId = (id) => {
    if (!id || id === "undefined" || !mongoose.isValidObjectId(id)) {
        return { error: "A valid announcement ID is required." };
    }
    return null;
};

// PUBLIC FEED — newest first, pinned announcements always on top (employees + admins)
export const getAnnouncements = async (req, res) => {
    try {
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 6));
        const announcements = await Announcement.find()
            .populate("authorId", "name email")
            .sort({ pinned: -1, createdAt: -1 })
            .limit(limit)
            .lean();
        const data = announcements.map((a) => ({
            ...a,
            id: a._id.toString(),
            author: a.authorId,
            authorId: a.authorId?._id?.toString(),
        }));
        return res.json({ data });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch announcements" });
    }
};

// ADMIN: PAGINATED MANAGEMENT LIST
export const getAllAnnouncements = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 10));
        const [announcements, total] = await Promise.all([
            Announcement.find()
                .populate("authorId", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Announcement.countDocuments(),
        ]);
        const data = announcements.map((a) => ({
            ...a,
            id: a._id.toString(),
            author: a.authorId,
            authorId: a.authorId?._id?.toString(),
        }));
        return res.json({ data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch announcements" });
    }
};

// GET A SINGLE ANNOUNCEMENT BY ID (all authenticated users)
export const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const invalid = validId(id);
        if (invalid) return res.status(400).json(invalid);

        const announcement = await Announcement.findById(id)
            .populate("authorId", "name email")
            .lean();
        if (!announcement) return res.status(404).json({ error: "Announcement not found" });

        return res.json({
            ...announcement,
            id: announcement._id.toString(),
            author: announcement.authorId,
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch announcement" });
    }
};

// ADMIN: CREATE
export const createAnnouncement = async (req, res) => {
    try {
        const { title, body, pinned } = req.body;
        if (!title?.trim() || !body?.trim()) {
            return res.status(400).json({ error: "Title and message are required" });
        }

        const announcement = await Announcement.create({
            title: title.trim(),
            body: body.trim(),
            pinned: Boolean(pinned),
            authorId: req.session.userId,
        });

        // Push a notification to every user (except the author) so the
        // announcement appears in the header bell.
        const author = await User.findById(req.session.userId).select("name email").lean();
        const authorName = author?.name || author?.email || "Admin";
        const users = await User.find({ _id: { $ne: req.session.userId } }).select("_id").lean();
        const message = `${authorName}: ${announcement.body.trim().slice(0, 120)}${announcement.body.trim().length > 120 ? "…" : ""}`;
        await Promise.all(users.map((u) =>
            notifyUser({
                userId: u._id,
                title: `New announcement: ${announcement.title}`,
                message,
                type: "ANNOUNCEMENT",
                link: `/announcements/${announcement._id}`,
                entityId: announcement._id,
            })
        ));

        await recordAudit({
            actorId: req.session.userId,
            action: "ANNOUNCEMENT_CREATE",
            entity: "ANNOUNCEMENT",
            entityId: announcement._id,
            details: { title: announcement.title },
        });

        return res.json({ success: true, data: announcement });
    } catch (error) {
        return res.status(500).json({ error: "Failed to create announcement" });
    }
};

// ADMIN: UPDATE
export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const invalid = validId(id);
        if (invalid) return res.status(400).json(invalid);

        const announcement = await Announcement.findById(id);
        if (!announcement) return res.status(404).json({ error: "Announcement not found" });

        if (typeof req.body.title === "string" && req.body.title.trim()) announcement.title = req.body.title.trim();
        if (typeof req.body.body === "string" && req.body.body.trim()) announcement.body = req.body.body.trim();
        if (typeof req.body.pinned === "boolean") announcement.pinned = req.body.pinned;

        await announcement.save();

        await recordAudit({
            actorId: req.session.userId,
            action: "ANNOUNCEMENT_UPDATE",
            entity: "ANNOUNCEMENT",
            entityId: announcement._id,
            details: { title: announcement.title },
        });

        return res.json({ success: true, data: announcement });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update announcement" });
    }
};

// ADMIN: DELETE
export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const invalid = validId(id);
        if (invalid) return res.status(400).json(invalid);

        const announcement = await Announcement.findByIdAndDelete(id);
        if (!announcement) return res.status(404).json({ error: "Announcement not found" });

        await recordAudit({
            actorId: req.session.userId,
            action: "ANNOUNCEMENT_DELETE",
            entity: "ANNOUNCEMENT",
            entityId: id,
            details: { title: announcement.title },
        });

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete announcement" });
    }
}