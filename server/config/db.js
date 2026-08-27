import mongoose from "mongoose";
import dns from "node:dns";

// Set DNS servers to Cloudflare and Google to resolve MongoDB SRV records properly
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"))
        await mongoose.connect(process.env.MONGODB_URI)
    } catch (error) {
        console.error("Database Connection Error : ", error.message)
    }
}

export default connectDB;

