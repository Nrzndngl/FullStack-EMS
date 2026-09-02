import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { listHolidays } from "../controllers/holidaysController.js";

const holidaysRouter = Router();

holidaysRouter.get("/", protect, listHolidays);

export default holidaysRouter;