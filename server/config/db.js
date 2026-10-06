import mongoose from "mongoose";
import dns from "node:dns";

// Use Cloudflare/Google resolvers to work around broken SRV lookups on some
// hosts. Guarded so an environment that disallows overriding the resolver pool
// cannot crash module load.
try {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (err) {
    console.warn("Could not override DNS servers:", err.message);
}

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

