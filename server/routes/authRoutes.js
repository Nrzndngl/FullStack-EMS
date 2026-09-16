import { Router } from "express";
import { changePassword, forgotPassword, login, logout, refresh, resetPassword, session } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from "../validators/index.js";

const authRouter = Router();

authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);
authRouter.get("/session", protect, session);
authRouter.put("/change-password", protect, validate(changePasswordSchema), changePassword);

export default authRouter;