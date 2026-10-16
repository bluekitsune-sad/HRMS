import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { requireRole, can } from "@/lib/rbac";
import { connectDB } from "@/lib/db";
import { Employee } from "@/models/Employee";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EmployeeDetailPage({
  params,
}: PageProps<"/employees/[id]">) {
  const user = await requireRole(["admin", "hr", "manager", "finance"]);
  const { id } = await params;

  await connectDB();
  const employee = await Employee.findById(id).populate("departmentId", "name").lean();
  if (!employee) notFound();

  const dept = employee.departmentId as unknown as { name?: string } | null;
  const showSalary = can(user.role, "salary.read");
  const canEdit = can(user.role, "employee.update");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
          <p className="text-sm text-muted-foreground">
            {employee.position ?? "No position"} · {dept?.name ?? "No department"}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge
              variant={
                employee.status === "active"
                  ? "success"
                  : employee.status === "terminated" || employee.status === "resigned"
                    ? "destructive"
                    : "warning"
              }
            >
              {employee.status.replace("-", " ")}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {employee.role}
            </Badge>
          </div>
        </div>
        {canEdit && (
          <Link
            href={`/employees/${String(employee._id)}/edit`}
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-4 text-sm font-medium shadow-sm hover:bg-accent"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          title="Profile"
          rows={[
            ["Employee code", employee.employeeCode],
            ["Email", employee.email],
            ["Phone", employee.phone ?? "—"],
            ["Joining date", employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"],
            ["Employment type", employee.employmentType],
          ]}
        />
        <InfoCard
          title={showSalary ? "Compensation" : "Compensation (restricted)"}
          rows={
            showSalary
              ? [
                  ["Monthly salary", employee.monthlySalary != null ? employee.monthlySalary.toLocaleString() : "—"],
                ]
              : [["Monthly salary", "Restricted"]]
          }
          restricted={!showSalary}
        />
        <InfoCard
          title="Skills"
          rows={
            (employee.skills as string[])?.length
              ? (employee.skills as string[]).map((s) => [s, ""] as [string, string])
              : [["No skills recorded", ""]]
          }
        />
      </div>
    </div>
  );
}

function InfoCard({
  title,
  rows,
  restricted,
}: {
  title: string;
  rows: [string, string][];
  restricted?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {restricted ? (
          <p className="text-sm text-muted-foreground">
            Your role doesn&apos;t have permission to view salary data.
          </p>
        ) : (
          <dl className="space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
