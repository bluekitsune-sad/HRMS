import "server-only";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import type { SessionUser } from "@/lib/rbac";

/**
 * Write an audit log entry (PRD §40).
 * Never throws — audit failures must not break the business operation,
 * but they are logged to console for ops.
 */
export async function logAudit(params: {
  actor: SessionUser;
  action: string;
  entityType: string;
  entityId?: string;
  summary?: string;
  oldValue?: unknown;
  newValue?: unknown;
}): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      actorUserId: params.actor.id,
      actorName: params.actor.name,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      summary: params.summary,
      oldValue: params.oldValue,
      newValue: params.newValue,
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}
