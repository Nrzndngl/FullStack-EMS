import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { exportAttendanceCsv, exportPayrollCsv } from "../controllers/reportController.js";

const reportRouter = Router();

reportRouter.get("/attendance", protect, protectAdmin, exportAttendanceCsv);
reportRouter.get("/payroll", protect, protectAdmin, exportPayrollCsv);

export default reportRouter;