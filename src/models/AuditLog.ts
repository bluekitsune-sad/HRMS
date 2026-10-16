import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Audit log per PRD §40 — every important HR action is recorded
 * with actor, action, target, and old/new values.
 */
const AuditLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorName: { type: String },
    action: { type: String, required: true, index: true }, // e.g. "employee.update", "salary.change"
    entityType: { type: String, required: true, index: true }, // "employee" | "department" | ...
    entityId: { type: String },
    summary: { type: String }, // human-readable, e.g. "Changed Ahmed's salary"
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema>;

export const AuditLog: Model<AuditLogDoc> =
  models.AuditLog ?? model("AuditLog", AuditLogSchema);
