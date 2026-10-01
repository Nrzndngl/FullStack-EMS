import mongoose from "mongoose";
import dns from "node:dns";

// Set DNS servers to Cloudflare and Google to resolve MongoDB SRV records properly
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"))
        mongoose.connection.on('error', (err) => console.error("Database runtime error:", err.message))
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    } catch (error) {
        console.error("Database Connection Error: ", error.message)
        throw error;
    }
}

export default connectDB;

