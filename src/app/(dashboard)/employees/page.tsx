import Link from "next/link";
import { Plus } from "lucide-react";
import { connectDB } from "@/lib/db";
import { requireRole, can } from "@/lib/rbac";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function EmployeesPage({
  searchParams,
}: PageProps<"/employees">) {
  const user = await requireRole(["admin", "hr", "manager", "finance"]);
  const { q = "", department = "" } = await searchParams;

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { employeeCode: { $regex: q, $options: "i" } },
    ];
  }
  if (department) filter.departmentId = department;

  const [employees, departments] = await Promise.all([
    Employee.find(filter)
      .populate("departmentId", "name")
      .sort({ name: 1 })
      .limit(200)
      .lean(),
    Department.find().sort({ name: 1 }).lean(),
  ]);

  // PRD §39: salary only for authorized roles — filtered server-side.
  const showSalary = can(user.role, "salary.read");
  const canCreate = can(user.role, "employee.create");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {employees.length} record{employees.length === 1 ? "" : "s"}
          </p>
        </div>
        {canCreate && (
          <Link
            href="/employees/new"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add employee
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="space-y-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Name, email or code…"
            className="h-9 w-64 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="department" className="text-xs font-medium text-muted-foreground">
            Department
          </label>
          <select
            id="department"
            name="department"
            defaultValue={department}
            className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All</option>
            {departments.map((d) => (
              <option key={String(d._id)} value={String(d._id)}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Apply
        </Button>
      </form>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              {showSalary && <TableHead className="text-right">Salary</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={showSalary ? 7 : 6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No employees found.
                </TableCell>
              </TableRow>
            )}
            {employees.map((e) => {
              const dept = e.departmentId as unknown as { name?: string } | null;
              return (
                <TableRow key={String(e._id)}>
                  <TableCell className="font-mono text-xs">{e.employeeCode}</TableCell>
                  <TableCell>
                    <Link
                      href={`/employees/${String(e._id)}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {e.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{e.email}</div>
                  </TableCell>
                  <TableCell>{e.position ?? "—"}</TableCell>
                  <TableCell>{dept?.name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="capitalize">{e.role}</TableCell>
                  {showSalary && (
                    <TableCell className="text-right font-mono">
                      {e.monthlySalary != null ? e.monthlySalary.toLocaleString() : "—"}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "active"
      ? "success"
      : status === "probation" || status === "on-leave"
        ? "warning"
        : "destructive";
  return (
    <Badge variant={variant as "success" | "warning" | "destructive"}>
      {status.replace("-", " ")}
    </Badge>
  );
}
