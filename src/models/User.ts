import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Roles per PRD §3.
 * - admin   : full system access
 * - hr       : employees, recruitment, attendance, leave, payroll prep
 * - manager  : projects, tasks, artist approval (Art Director)
 * - artist   : self-service, tasks, portfolio
 * - finance  : payroll + payment verification
 */
export const ROLES = ["admin", "hr", "manager", "artist", "finance"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ROLES, required: true, default: "artist" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDoc> = models.User ?? model("User", UserSchema);
