import { Router } from "express";
import { getNotifications, markRead, markAllRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const notificationRouter = Router();

notificationRouter.get("/", protect, getNotifications);
notificationRouter.put("/read-all", protect, markAllRead);
notificationRouter.put("/:id/read", protect, markRead);

export default notificationRouter;