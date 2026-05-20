import dbConnect from "../src/lib/mongodb.js";
import User from "../src/models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function createAdmin() {
  await dbConnect();
  
  const adminExists = await User.findOne({ whatsapp: "1234567890" });
  
  if (adminExists) {
    console.log("Admin already exists");
    process.exit(0);
  }
  
  const hashedPassword = await bcrypt.hash("Admin1234", 10);
  
  await User.create({
    name: "Admin",
    whatsapp: "3001234567",
    password: hashedPassword,
    role: "ADMIN"
  });
  
  console.log("Admin created successfully: 3001234567 / Admin1234");
  process.exit(0);
}

createAdmin();
