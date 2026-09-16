import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { clockInOut, getAttendance, getAllAttendance, correctAttendance } from "../controllers/attendanceController.js";
import {
    createCorrectionRequest,
    getMyCorrectionRequests,
    getAllCorrectionRequests,
    reviewCorrectionRequest,
} from "../controllers/attendanceCorrectionController.js";

const attendanceRouter = Router();

attendanceRouter.post('/', protect, clockInOut)
attendanceRouter.get('/', protect, getAttendance)
attendanceRouter.get('/all', protect, protectAdmin, getAllAttendance)
attendanceRouter.put('/:id/correct', protect, protectAdmin, correctAttendance)

// Attendance correction requests
attendanceRouter.get('/corrections/my', protect, getMyCorrectionRequests)
attendanceRouter.post('/corrections', protect, createCorrectionRequest)
attendanceRouter.get('/corrections/all', protect, protectAdmin, getAllCorrectionRequests)
attendanceRouter.put('/corrections/:id/review', protect, protectAdmin, reviewCorrectionRequest)

export default attendanceRouter;