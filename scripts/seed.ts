/**
 * Seed script — creates the initial admin, departments and a few sample employees.
 * Usage: npm run seed  (loads .env.local via node --env-file)
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/db";
import { User } from "../src/models/User";
import { Department } from "../src/models/Department";
import { Employee } from "../src/models/Employee";

async function nextEmployeeCode(prefix: string, count: number) {
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

async function main() {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@artflow.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  // --- Admin user ---------------------------------------------------------
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`Admin already exists: ${adminEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({
      email: adminEmail,
      passwordHash,
      name: "Studio Admin",
      role: "admin",
    });
    console.log(`Created admin: ${adminEmail} / ${adminPassword}`);
  }

  // --- Departments ---------------------------------------------------------
  const deptNames = [
    { name: "Art", description: "Illustration, character design and concept art" },
    { name: "Animation", description: "2D/3D animation and motion" },
    { name: "Production", description: "Project management and production coordination" },
    { name: "HR & Admin", description: "People operations" },
    { name: "Finance", description: "Payroll and payments" },
  ];
  const deptIdByName = new Map<string, mongoose.Types.ObjectId>();
  for (const d of deptNames) {
    let dept = await Department.findOne({ name: d.name });
    if (!dept) {
      dept = await Department.create(d);
      console.log(`Created department: ${d.name}`);
    }
    deptIdByName.set(d.name, dept._id as mongoose.Types.ObjectId);
  }

  // --- Sample employees ------------------------------------------------------
  const samples = [
    {
      name: "Sarah Khan",
      email: "sarah@artflow.local",
      position: "Character Artist",
      department: "Art",
      role: "artist" as const,
      skills: ["Character Art", "Illustration", "Photoshop"],
      monthlySalary: 120000,
    },
    {
      name: "Ahmed Raza",
      email: "ahmed@artflow.local",
      position: "Illustrator",
      department: "Art",
      role: "artist" as const,
      skills: ["Illustration", "Digital Painting"],
      monthlySalary: 150000,
    },
    {
      name: "Ali Hassan",
      email: "ali@artflow.local",
      position: "Art Director",
      department: "Production",
      role: "manager" as const,
      skills: ["Art Direction", "Concept Art"],
      monthlySalary: 180000,
    },
    {
      name: "Zara Malik",
      email: "zara@artflow.local",
      position: "HR Manager",
      department: "HR & Admin",
      role: "hr" as const,
      skills: ["People Operations"],
      monthlySalary: 140000,
    },
  ];

  let count = await Employee.countDocuments();
  for (const s of samples) {
    const exists = await Employee.findOne({ email: s.email });
    if (exists) {
      console.log(`Employee exists: ${s.email}`);
      continue;
    }
    count += 1;
    await Employee.create({
      employeeCode: await nextEmployeeCode("ART", count),
      name: s.name,
      email: s.email,
      position: s.position,
      departmentId: deptIdByName.get(s.department),
      employmentType: "full-time",
      status: "active",
      role: s.role,
      skills: s.skills,
      monthlySalary: s.monthlySalary,
      joiningDate: new Date("2025-01-15"),
    });
    console.log(`Created employee: ${s.name} (${s.email})`);
  }

  await mongoose.disconnect();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
