import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import multer from "multer";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import authRouter from "./routes/authRoutes.js";
import employeeRouter from "./routes/employeeRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import leaveRouter from "./routes/leaveRoutes.js";
import payslipRouter from "./routes/payslipsRoutes.js";
import dashboardRouter from "./routes/dashboardRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import holidaysRouter from "./routes/holidaysRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import auditRouter from "./routes/auditRoutes.js";
import announcementRouter from "./routes/announcementRoutes.js";

import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

// Fail fast when critical secrets are missing or dangerously weak.
const bootChecks = () => {
    const required = [
        ["MONGODB_URI", "MongoDB connection string"],
        ["JWT_SECRET", "JWT access-token secret (min 32 chars)"],
        ["JWT_REFRESH_SECRET", "JWT refresh-token secret (min 32 chars)"],
    ];
    for (const [key, label] of required) {
        if (!process.env[key] || process.env[key].length < 32) {
            throw new Error(`FATAL: ${label} (${key}) is missing or too short. Set it in the environment.`);
        }
    }
    if (process.env.NODE_ENV === "production" && !process.env.INNGEST_SIGNING_KEY) {
        throw new Error("FATAL: INNGEST_SIGNING_KEY is required in production for /api/inngest.");
    }
};

const app = express()
const PORT = process.env.PORT || 4000;

bootChecks();

// Behind Vercel/NGINX the client IP is carried by X-Forwarded-For
app.set("trust proxy", 1);

const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(",")).split(",").map((s) => s.trim());

//Middleware
app.use(helmet());
app.disable("x-powered-by");
app.use(cors({
    origin(origin, callback) {
        // Allow requests with no origin (e.g. curl, server-to-server) and configured origins
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    maxAge: 600,
}));
app.use(express.json());
app.use(cookieParser());

// General API limiter (applied to all /api traffic, before body parsing)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: Number(process.env.API_RATE_LIMIT) || 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later" },
});
app.use("/api", apiLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later" },
});
app.use("/api/auth", authLimiter);

// Parse multipart/form-data ONLY where it is needed (bio/image FormData).
// Mounted after the rate limiter and with strict field limits to bound memory.
const formParse = multer({ limits: { fields: 15, fieldSize: 3 * 1024 * 1024, parts: 15 } }).none();
app.use("/api/profile", formParse);
app.use("/api/employees", formParse);

//Routes
app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/auth", authRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/profile", profileRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leaves", leaveRouter);
app.use("/api/payslips", payslipRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/reports", reportRouter);
app.use("/api/holidays", holidaysRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/audit", auditRouter);
app.use("/api/announcements", announcementRouter);

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Global error handler - never leak internals to the client
app.use((err, req, res, next) => {
    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ error: "Not allowed by CORS" });
    }
    // Malformed ObjectIds / validation errors from Mongoose -> 400, not 500
    if (err?.name === "CastError" || err?.name === "ValidationError") {
        return res.status(400).json({ error: "Invalid request data" });
    }
    if (err?.type === "entity.parse.failed" || err?.type === "entity.too.large") {
        return res.status(400).json({ error: "Invalid or oversize request body" });
    }
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({ error: "Internal server error" });
});

await connectDB();

//Listening port
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});