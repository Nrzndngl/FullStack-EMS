import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createPayslipSchema } from "../validators/index.js";
import { createPayslip, generateBatchPayslips, getPayslipById, getPayslips } from "../controllers/payslipController.js";

const payslipRouter = Router();

payslipRouter.post("/", protect, protectAdmin, validate(createPayslipSchema), createPayslip)
payslipRouter.post("/batch", protect, protectAdmin, generateBatchPayslips)
payslipRouter.get("/", protect, getPayslips)
payslipRouter.get("/:id", protect, getPayslipById)

export default payslipRouter;