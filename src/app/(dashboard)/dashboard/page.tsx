import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { Employee } from "@/models/Employee";
import { Department } from "@/models/Department";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, UserCheck, UserPlus } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();

  // DB-backed stats (best-effort — dashboard still renders if DB is unreachable)
  let stats = { employees: 0, active: 0, departments: 0, artists: 0 };
  let dbError: string | null = null;
  try {
    await connectDB();
    const [employees, active, departments, artists] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: "active" }),
      Department.countDocuments(),
      Employee.countDocuments({ role: "artist" }),
    ]);
    stats = { employees, active, departments, artists };
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database unavailable";
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across the studio today.
        </p>
      </div>

      {dbError && (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <p className="font-medium">Database not connected</p>
          <p className="text-muted-foreground">
            Add your MongoDB Atlas connection string to <code className="font-mono">.env.local</code>{" "}
            and restart the dev server. ({dbError})
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Employees" value={stats.employees} icon={Users} />
        <StatCard title="Active" value={stats.active} icon={UserCheck} />
        <StatCard title="Departments" value={stats.departments} icon={Building2} />
        <StatCard title="Artists" value={stats.artists} icon={UserPlus} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roadmap</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Sprint 1 (foundation): auth, roles, employees, departments and this
            dashboard. Attendance, leave, payroll, the task marketplace and
            Studio Pulse arrive in Sprints 2–6.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
