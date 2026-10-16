import { requireRole } from "@/lib/rbac";
import { connectDB } from "@/lib/db";
import { Department } from "@/models/Department";
import { EmployeeForm } from "@/components/employee-form";

export default async function NewEmployeePage() {
  await requireRole(["admin", "hr"]);
  await connectDB();
  const departments = await Department.find().sort({ name: 1 }).lean();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
        <p className="text-sm text-muted-foreground">
          Create an employee record and optionally a login account.
        </p>
      </div>
      <EmployeeForm
        departments={departments.map((d) => ({
          _id: String(d._id),
          name: d.name,
        }))}
      />
    </div>
  );
}
