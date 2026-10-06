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

// Fail fast when critical secrets are missing or dangerously weak. Instead of a
// bare module-load crash (which Vercel reports as a headerless 500 on every
// request), capture the message so the server can respond with a readable error.
const bootChecks = () => {
    const required = [
        ["MONGODB_URI", "MongoDB connection string"],
        ["JWT_SECRET", "JWT access-token secret (min 32 chars)"],
        ["JWT_REFRESH_SECRET", "JWT refresh-token secret (min 32 chars)"],
    ];
    for (const [key, label] of required) {
        if (!process.env[key] || process.env[key].length < 32) {
            console.error(`FATAL: ${label} (${key}) is missing or too short.`);
            return `Missing or too-short ${label} (${key}). Set it in the deployment environment.`;
        }
    }
    if (process.env.NODE_ENV === "production" && !process.env.INNGEST_SIGNING_KEY) {
        console.error("FATAL: INNGEST_SIGNING_KEY is missing.");
        return "INNGEST_SIGNING_KEY is required in production for /api/inngest.";
    }
    return null;
};

const app = express()
const PORT = process.env.PORT || 4000;

const bootError = bootChecks();

// Behind Vercel/NGINX the client IP is carried by X-Forwarded-For
app.set("trust proxy", 1);

// Production frontend is allowed by default so a deploy without CORS_ORIGINS
// works; CORS_ORIGINS can still override the list.
const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://full-stack-ems-bice-pi.vercel.app",
];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(",")).split(",").map((s) => s.trim());

//Middleware — CORS first, before body parsing, rate limiting, and routes. A
// disallowed origin must NEVER throw inside the cors callback: that turns a
// benign CORS block into a 500 (what the browser observed on the OPTIONS).
const corsOptions = {
    origin(origin, callback) {
        // Allow requests with no origin (e.g. curl, server-to-server) and configured origins
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false); // no ACAO header -> browser blocks; server still answers 204
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
};
app.use(cors(corsOptions));
// Guarantee every OPTIONS request anywhere returns 204. Express 5 /
// path-to-regexp v8 dropped the bare "*" wildcard (that crashes module load
// with a 500), so use the named-splat syntax and finish non-preflight OPTIONS
// with an explicit 204.
app.options("/*splat", (req, res, next) =>
    cors(corsOptions)(req, res, () => res.status(204).end())
);

// Express 5 + helmet: disable the headers that break cross-origin API reads
// (Cross-Origin-Resource-Policy: same-origin is what produces the
// "MissingAllowOriginHeader"-style failures on a CORS frontend), and CSP is
// irrelevant for a JSON API that never renders HTML.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
}));
app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());

// If boot checks failed, answer every non-OPTIONS request with a readable error
// so DevTools/Vercel logs show WHAT is wrong instead of a headerless 500.
// Preflight OPTIONS are still answered by the CORS handler above (204 + ACAO).
if (bootError) {
    app.use("/", (req, res, next) => {
        if (req.method === "OPTIONS") return next();
        return res.status(500).json({ error: "Server misconfigured", detail: bootError });
    });
}

// General API limiter (applied to all /api traffic, before body parsing).
// OPTIONS preflights are skipped entirely (never counted, never blocking) and
// proxy-header validation is off so odd X-Forwarded-For shapes from the edge
// network cannot crash the middleware chain with a 500.
const limiterCommon = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    skip: (req) => req.method === "OPTIONS",
};
const apiLimiter = rateLimit({
    ...limiterCommon,
    limit: Number(process.env.API_RATE_LIMIT) || 600,
    message: { error: "Too many requests, please try again later" },
});
app.use("/api", apiLimiter);

const authLimiter = rateLimit({
    ...limiterCommon,
    limit: 30,
    message: { error: "Too many login attempts, please try again later" },
});
// Only the credential-aware endpoints get the tighter limiter; refresh,
// logout, session and change-password are not password-guessing surfaces and
// must not throttle legitimate users.
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Parse multipart/form-data ONLY where it is needed (bio/image FormData).
// Mounted after the rate limiter and with strict field limits to bound memory.
const formParse = multer({ limits: { fields: 15, fieldSize: 3 * 1024 * 1024, parts: 15 } }).none();
app.use("/api/profile", formParse);
app.use("/api/employees", formParse);

//Routes
app.get("/", (req, res) => res.send("Server is running"));
// Lightweight probe (no DB dependency) to distinguish env failures from DB failures
app.get("/api/health", (req, res) => res.json({ ok: true }));
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

if (!bootError) {
    try {
        await connectDB();
    } catch (error) {
        // Keep the server alive so /api/health can still report and the readable
        // env-diagnosis middleware works, instead of a module-load crash that
        // Vercel would surface as a headerless 500.
        console.error("Database connection failed:", error.message);
    }
}

//Listening port
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});