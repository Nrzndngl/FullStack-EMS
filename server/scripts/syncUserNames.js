import "dotenv/config";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

// One-time backfill: copy full names from existing Employee records onto their
// linked User accounts so the sidebar/login payload has a display name.
async function run() {
    await connectDB();

    const employees = await Employee.find({ userId: { $exists: true, $ne: null } }).lean();
    let updated = 0;
    for (const emp of employees) {
        const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
        const res = await User.updateOne(
            { _id: emp.userId, name: { $ne: name } },
            { $set: { name } }
        );
        if (res.modifiedCount) updated++;
    }

    const adminName = process.env.ADMIN_NAME || "Administrator";
    const admins = await User.updateMany(
        { role: "ADMIN", $or: [{ name: { $in: ["", null] } }, { name: { $exists: false } }] },
        { $set: { name: adminName } }
    );

    console.log(`synced employee names: ${updated} updated; admins named: ${admins.modifiedCount}`);
    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});