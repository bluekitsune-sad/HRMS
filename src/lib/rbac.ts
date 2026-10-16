import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/models/User";

/**
 * Server-side RBAC (PRD §39).
 * Every page/action must call these — hidden UI is NOT authorization.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** Returns the session user or redirects to /login. For pages. */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

/** Returns the session user or null. For server actions / APIs. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user ?? null;
}

/** Page-level guard: signed in + role in allowed list. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

/** Action/API-level guard: returns error message instead of redirecting. */
export async function authorizeAction(
  roles: Role[]
): Promise<{ user: SessionUser } | { error: string }> {
  const user = await getSessionUser();
  if (!user) return { error: "Unauthorized" };
  if (!roles.includes(user.role)) return { error: "Forbidden" };
  return { user };
}

/**
 * Role → permission map. Central place to decide who can do what.
 * Salary/payroll visibility is deliberately narrow (PRD §39:
 * "No salary data exposed to unauthorized users").
 */
export const PERMISSIONS = {
  "employee.read": ["admin", "hr", "manager", "finance"],
  "employee.create": ["admin", "hr"],
  "employee.update": ["admin", "hr"],
  "employee.delete": ["admin"],
  "salary.read": ["admin", "finance", "hr"],
  "salary.write": ["admin", "finance"],
  "department.read": ["admin", "hr", "manager", "finance", "artist"],
  "department.create": ["admin", "hr"],
  "department.update": ["admin", "hr"],
  "department.delete": ["admin"],
  "auditlog.read": ["admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

/** Throwing variant for server actions. */
export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: role "${role}" lacks permission "${permission}"`);
  }
}
