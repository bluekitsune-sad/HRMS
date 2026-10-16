"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { authorizeAction, assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { Employee } from "@/models/Employee";
import { User } from "@/models/User";
import { employeeSchema, fieldErrors } from "@/lib/validation";
import bcrypt from "bcryptjs";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
} | null;

/** HR/Admin: create an employee (optionally with a login account). */
export async function createEmployee(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authz = await authorizeAction(["admin", "hr"]);
  if ("error" in authz) return { message: authz.error };
  const user = authz.user;

  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    position: formData.get("position"),
    departmentId: formData.get("departmentId"),
    joiningDate: formData.get("joiningDate"),
    employmentType: formData.get("employmentType"),
    status: formData.get("status"),
    role: formData.get("role"),
    monthlySalary: formData.get("monthlySalary"),
    skills: formData.get("skills"),
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;

  try {
    await connectDB();

    const dup = await Employee.findOne({ email: data.email });
    if (dup) {
      return { errors: { email: "An employee with this email already exists." } };
    }

    // Auto-increment-ish code based on current count.
    const count = await Employee.countDocuments();
    const employeeCode = `ART-${String(count + 1).padStart(4, "0")}`;

    const skills = data.skills
      ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const employee = await Employee.create({
      employeeCode,
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      position: data.position || undefined,
      departmentId:
        data.departmentId && Types.ObjectId.isValid(data.departmentId)
          ? new Types.ObjectId(data.departmentId)
          : undefined,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      employmentType: data.employmentType,
      status: data.status,
      role: data.role,
      monthlySalary:
        data.monthlySalary === "" || data.monthlySalary === undefined
          ? undefined
          : Number(data.monthlySalary),
      skills,
    });

    // Optional login account
    const password = formData.get("password");
    const createAccount = formData.get("createAccount") === "on";
    if (createAccount && typeof password === "string" && password.length >= 8) {
      const passwordHash = await bcrypt.hash(password, 12);
      await User.create({
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
      });
      await Employee.updateOne(
        { _id: employee._id },
        { $set: { userId: (await User.findOne({ email: data.email }))?._id } }
      );
    }

    await logAudit({
      actor: user,
      action: "employee.create",
      entityType: "employee",
      entityId: String(employee._id),
      summary: `Created employee ${data.name}`,
      newValue: { name: data.name, email: data.email, role: data.role },
    });

    revalidatePath("/employees");
    return { ok: true, message: `${data.name} added.` };
  } catch (err) {
    console.error("createEmployee", err);
    return { message: "Failed to create employee. Try again." };
  }
}

/** HR/Admin: update an employee. */
export async function updateEmployee(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authz = await authorizeAction(["admin", "hr"]);
  if ("error" in authz) return { message: authz.error };
  const user = authz.user;

  if (!Types.ObjectId.isValid(id)) return { message: "Invalid employee id." };

  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    position: formData.get("position"),
    departmentId: formData.get("departmentId"),
    joiningDate: formData.get("joiningDate"),
    employmentType: formData.get("employmentType"),
    status: formData.get("status"),
    role: formData.get("role"),
    monthlySalary: formData.get("monthlySalary"),
    skills: formData.get("skills"),
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  try {
    await connectDB();
    const before = await Employee.findById(id);
    if (!before) return { message: "Employee not found." };

    const skills = data.skills
      ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : before.skills;

    const salary =
      data.monthlySalary === "" || data.monthlySalary === undefined
        ? before.monthlySalary
        : Number(data.monthlySalary);

    await Employee.updateOne(
      { _id: id },
      {
        $set: {
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          position: data.position || undefined,
          departmentId:
            data.departmentId && Types.ObjectId.isValid(data.departmentId)
              ? new Types.ObjectId(data.departmentId)
              : undefined,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
          employmentType: data.employmentType,
          status: data.status,
          role: data.role,
          monthlySalary: salary,
          skills,
        },
      }
    );

    // Audit salary changes specially (PRD §40 example).
    if (before.monthlySalary !== salary) {
      await logAudit({
        actor: user,
        action: "salary.change",
        entityType: "employee",
        entityId: id,
        summary: `Changed ${data.name}'s salary`,
        oldValue: before.monthlySalary,
        newValue: salary,
      });
    }

    await logAudit({
      actor: user,
      action: "employee.update",
      entityType: "employee",
      entityId: id,
      summary: `Updated employee ${data.name}`,
    });

    revalidatePath("/employees");
    return { ok: true, message: "Employee updated." };
  } catch (err) {
    console.error("updateEmployee", err);
    return { message: "Failed to update employee." };
  }
}

/** Admin only: deactivate (soft-delete) an employee. */
export async function deleteEmployee(id: string): Promise<ActionState> {
  const authz = await authorizeAction(["admin"]);
  if ("error" in authz) return { message: authz.error };
  const user = authz.user;

  if (!Types.ObjectId.isValid(id)) return { message: "Invalid employee id." };

  try {
    await connectDB();
    const emp = await Employee.findById(id);
    if (!emp) return { message: "Employee not found." };

    assertCan(user.role, "employee.delete");

    await Employee.updateOne({ _id: id }, { $set: { status: "terminated" } });

    await logAudit({
      actor: user,
      action: "employee.deactivate",
      entityType: "employee",
      entityId: id,
      summary: `Deactivated employee ${emp.name}`,
      oldValue: emp.status,
      newValue: "terminated",
    });

    revalidatePath("/employees");
    return { ok: true, message: `${emp.name} deactivated.` };
  } catch (err) {
    console.error("deleteEmployee", err);
    return { message: "Failed to deactivate employee." };
  }
}
