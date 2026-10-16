import { notFound } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { EmployeeForm } from "@/components/employee-form";

export default async function EditEmployeePage({
  params,
}: PageProps<"/employees/[id]/edit">) {
  await requireRole(["admin", "hr"]);
  const { id } = await params;

  await connectDB();
  const [employee, departments] = await Promise.all([
    Employee.findById(id).lean(),
    Department.find().sort({ name: 1 }).lean(),
  ]);
  if (!employee) notFound();

  const deptId = employee.departmentId
    ? String(employee.departmentId as unknown as { toString(): string })
    : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit {employee.name}</h1>
        <p className="text-sm text-muted-foreground">{employee.employeeCode}</p>
      </div>
      <EmployeeForm
        employeeId={String(employee._id)}
        departments={departments.map((d) => ({
          _id: String(d._id),
          name: d.name,
        }))}
        defaults={{
          name: employee.name,
          email: employee.email,
          phone: employee.phone ?? "",
          position: employee.position ?? "",
          departmentId: deptId,
          joiningDate: employee.joiningDate
            ? new Date(employee.joiningDate).toISOString()
            : undefined,
          employmentType: employee.employmentType,
          status: employee.status,
          role: employee.role,
          monthlySalary: employee.monthlySalary ?? null,
          skills: (employee.skills as string[]) ?? [],
        }}
      />
    </div>
  );
}
