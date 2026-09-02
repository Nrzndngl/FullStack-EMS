import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createLeaveSchema, updateLeaveStatusSchema } from "../validators/index.js";
import { createLeave, getLeaves, updateLeaveStatus } from "../controllers/leaveController.js";

const leaveRouter = Router();

leaveRouter.post("/", protect, validate(createLeaveSchema), createLeave)
leaveRouter.get("/", protect, getLeaves)
leaveRouter.patch("/:id", protect, protectAdmin, validate(updateLeaveStatusSchema), updateLeaveStatus)

export default leaveRouter;