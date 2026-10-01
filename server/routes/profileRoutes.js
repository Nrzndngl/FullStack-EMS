import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../validators/index.js";
import { getProfile, updateProfile, getProfileByEmployeeId, getAdminProfile } from "../controllers/profileController.js";

const profileRouter = Router();

profileRouter.get("/", protect, getProfile)
profileRouter.get("/admin", protect, protectAdmin, getAdminProfile)
profileRouter.get("/:id", protect, getProfileByEmployeeId)
profileRouter.put("/", protect, validate(updateProfileSchema), updateProfile)

export default profileRouter;