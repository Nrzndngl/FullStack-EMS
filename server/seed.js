import "dotenv/config";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// Prefer an explicit ADMIN_PASSWORD (>= 12 chars); otherwise generate a random
// one-time password. Never fall back to the widely-known "admin123" in
// production-style seeding.
const TemporaryPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("hex");
if (!process.env.ADMIN_PASSWORD) {
    console.warn("ADMIN_PASSWORD not set; a random password was generated. It is logged below — change it after login.");
}

async function registerAdmin() {
    try {
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

        if (!ADMIN_EMAIL) {
            console.error('Missing ADMIN_EMAIL env var');
            process.exit(1)
        }
        await connectDB()

        const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (existingAdmin) {
            console.log("Admin already exists", existingAdmin.role);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(TemporaryPassword, 10);

        const admin = await User.create({
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            role: "ADMIN",
            name: process.env.ADMIN_NAME || "Administrator",
        })
        console.log("Admin created");
        console.log("\nemail:", admin.email);
        console.log("password:", TemporaryPassword);
        console.log("\nchange this password after login")
        process.exit(0);

    } catch (error) {
        console.log("Error registering admin:", error.message);
        process.exit(1);
    }
}
registerAdmin();