import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../validators/index.js";
import { getProfile, updateProfile } from "../controllers/profileController.js";

const profileRouter = Router();

profileRouter.get("/", protect, getProfile)
profileRouter.put("/", protect, validate(updateProfileSchema), updateProfile)

export default profileRouter;