import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { clockInOut, getAttendance, getAllAttendance, correctAttendance } from "../controllers/attendanceController.js";

const attendanceRouter = Router();

attendanceRouter.post('/', protect, clockInOut)
attendanceRouter.get('/', protect, getAttendance)
attendanceRouter.get('/all', protect, protectAdmin, getAllAttendance)
attendanceRouter.put('/:id/correct', protect, protectAdmin, correctAttendance)

export default attendanceRouter;