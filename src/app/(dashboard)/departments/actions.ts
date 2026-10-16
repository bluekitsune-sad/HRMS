"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { authorizeAction } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { Department } from "@/models/Department";
import { departmentSchema, fieldErrors } from "@/lib/validation";

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
} | null;

export async function createDepartment(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const authz = await authorizeAction(["admin", "hr"]);
  if ("error" in authz) return { message: authz.error };

  const parsed = departmentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  try {
    await connectDB();

    const dup = await Department.findOne({ name: parsed.data.name });
    if (dup) return { errors: { name: "A department with this name already exists." } };

    const dept = await Department.create({
      name: parsed.data.name,
      description: parsed.data.description || undefined,
    });

    await logAudit({
      actor: authz.user,
      action: "department.create",
      entityType: "department",
      entityId: String(dept._id),
      summary: `Created department ${parsed.data.name}`,
    });

    revalidatePath("/departments");
    return { ok: true, message: `Department "${parsed.data.name}" created.` };
  } catch (err) {
    console.error("createDepartment", err);
    return { message: "Failed to create department." };
  }
}

export async function deleteDepartment(id: string): Promise<ActionState> {
  const authz = await authorizeAction(["admin"]);
  if ("error" in authz) return { message: authz.error };

  if (!Types.ObjectId.isValid(id)) return { message: "Invalid department id." };

  try {
    await connectDB();
    const { Employee } = await import("@/models/Employee");
    const inUse = await Employee.countDocuments({
      departmentId: new Types.ObjectId(id),
      status: { $ne: "terminated" },
    });
    if (inUse > 0) {
      return { message: `Cannot delete: ${inUse} employee(s) still in this department.` };
    }

    const dept = await Department.findByIdAndDelete(id);
    if (!dept) return { message: "Department not found." };

    await logAudit({
      actor: authz.user,
      action: "department.delete",
      entityType: "department",
      entityId: id,
      summary: `Deleted department ${dept.name}`,
      oldValue: dept.name,
    });

    revalidatePath("/departments");
    return { ok: true, message: `Department "${dept.name}" deleted.` };
  } catch (err) {
    console.error("deleteDepartment", err);
    return { message: "Failed to delete department." };
  }
}
