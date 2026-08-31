import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import multer from "multer";
import authRouter from "./routes/authRoutes.js";
import employeeRouter from "./routes/employeeRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import leaveRouter from "./routes/leaveRoutes.js";
import payslipRouter from "./routes/payslipsRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";

import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

const app = express()
const PORT = process.env.PORT || 4000;

const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://full-stack-ems-bice-pi.vercel.app",
];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(",")).split(",").map((s) => s.trim());

//Middleware
app.use(cors({
    origin(origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl) and configured origins
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.use(express.json());
// Parse multipart/form-data (form-driven endpoints send FormData; JSON passes through untouched)
app.use(multer().none());

//Routes
app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/auth", authRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/profile", profileRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leaves", leaveRouter);
app.use("/api/payslips", payslipRouter);
app.use("/api/dashboard", dashboardRouter);

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ error: "Not allowed by CORS" });
    }
    res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

await connectDB();

//Listening port
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});