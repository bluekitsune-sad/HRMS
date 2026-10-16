import { connectDB } from "@/lib/db";
import { requireRole, can } from "@/lib/rbac";
import { Department } from "@/models/Department";
import { Employee } from "@/models/Employee";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DepartmentForm,
  DeleteDepartmentButton,
} from "@/components/department-forms";

export default async function DepartmentsPage() {
  const user = await requireRole([
    "admin",
    "hr",
    "manager",
    "artist",
    "finance",
  ]);
  await connectDB();

  const departments = await Department.find().sort({ name: 1 }).lean();
  const counts = await Employee.aggregate([
    { $match: { status: { $ne: "terminated" } } },
    { $group: { _id: "$departmentId", count: { $sum: 1 } } },
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));

  const canManage = can(user.role, "department.create");
  const canDelete = can(user.role, "department.delete");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
        <p className="text-sm text-muted-foreground">
          {departments.length} department{departments.length === 1 ? "" : "s"}
        </p>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add department</CardTitle>
            <CardDescription>Create a new studio department.</CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentForm />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.length === 0 && (
          <p className="text-sm text-muted-foreground">No departments yet.</p>
        )}
        {departments.map((d) => (
          <Card key={String(d._id)}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{d.name}</CardTitle>
                {d.description && (
                  <CardDescription className="mt-1">{d.description}</CardDescription>
                )}
              </div>
              {canDelete && <DeleteDepartmentButton id={String(d._id)} name={d.name} />}
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold">
                {countById.get(String(d._id)) ?? 0}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">members</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
