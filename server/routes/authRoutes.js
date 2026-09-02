import { Router } from "express";
import { changePassword, login, logout, refresh, session } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { changePasswordSchema, loginSchema } from "../validators/index.js";

const authRouter = Router();

authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/session", protect, session);
authRouter.put("/change-password", protect, validate(changePasswordSchema), changePassword);

export default authRouter;