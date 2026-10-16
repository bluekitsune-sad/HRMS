import * as z from "zod";
import { ROLES } from "@/models/User";
import { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from "@/models/Employee";

/** Zod 4 schemas for Sprint 1 forms (PRD §39: input validation). */

export const loginSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
});

export const departmentSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim().max(80),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const employeeSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim().max(120),
  email: z.email({ error: "Enter a valid email." }).trim(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  position: z.string().trim().max(120).optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  joiningDate: z.string().optional().or(z.literal("")),
  employmentType: z.enum(EMPLOYMENT_TYPES, { error: "Pick an employment type." }),
  status: z.enum(EMPLOYEE_STATUSES, { error: "Pick a status." }),
  role: z.enum(ROLES, { error: "Pick a role." }),
  monthlySalary: z.coerce
    .number({ error: "Salary must be a number." })
    .min(0, { error: "Salary can't be negative." })
    .optional()
    .or(z.literal("")),
  skills: z.string().trim().optional().or(z.literal("")), // comma-separated in forms
});

export const employeeUpdateSchema = employeeSchema;

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;

/** Flatten Zod errors into { field: message } for useActionState. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
