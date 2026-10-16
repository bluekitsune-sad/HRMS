import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "./User";

export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "intern"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYEE_STATUSES = ["active", "probation", "on-leave", "resigned", "terminated"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

/**
 * Employee profile per PRD §5.
 * Note: `monthlySalary` is sensitive HR data (PRD §39) — always filtered out
 * server-side unless the requester is admin/finance (or HR when explicitly allowed).
 */
const EmployeeSchema = new Schema(
  {
    // Human-readable employee code, e.g. "ART-0001"
    employeeCode: { type: String, required: true, unique: true, index: true },

    // Auth account this employee is linked to (created by HR/Admin).
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },

    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    photoUrl: { type: String },

    departmentId: { type: Schema.Types.ObjectId, ref: "Department", index: true },
    position: { type: String, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: "Employee" },

    joiningDate: { type: Date },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: "full-time" },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: "active", index: true },

    // Access role, mirrors User.role for quick RBAC checks without a join.
    role: { type: String, enum: ROLES, default: "artist" },

    // Sensitive — PRD §39: never expose to unauthorized users.
    monthlySalary: { type: Number, min: 0 },

    // Professional info (PRD §6) — full creative profile lands in Sprint 5.
    skills: [{ type: String, trim: true }],
    software: [{ type: String, trim: true }],
    specializations: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

EmployeeSchema.index({ departmentId: 1, status: 1 });
EmployeeSchema.index({ name: "text", email: "text", position: "text" });

export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema>;

export const Employee: Model<EmployeeDoc> =
  models.Employee ?? model("Employee", EmployeeSchema);
