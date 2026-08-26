import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import multer from "multer";
import authRouter from "./routes/authRoutes.js";
import employeeRouter from "./routes/employeeRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";


const app = express()
const PORT = process.env.PORT || 4000;

//Middleware
app.use(cors());
app.use(express.json());
app.use(multer().none())

//Routes
app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/auth", authRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/profile", profileRouter);
app.use("/api/attendance", attendanceRouter)

await connectDB();

//Listening port
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});