import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import userModel from "./src/models/user.model.js";

dotenv.config();

async function seedAdmin() {
  try {
    console.log("Connecting to database at:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully!");

    const adminEmail = "admin@mechago.com";
    const existingAdmin = await userModel.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin account '${adminEmail}' already exists. No action required.`);
      process.exit(0);
    }

    console.log("Creating default administrator account...");
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await userModel.create({
      name: "System Admin",
      phone: "+919999999999",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isVerified: true
    });

    console.log("Admin account seeded successfully!");
    console.log("Email: admin@mechago.com");
    console.log("Password: admin123");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding administrator account:", error);
    process.exit(1);
  }
}

seedAdmin();
