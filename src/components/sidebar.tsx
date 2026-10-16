"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  CalendarDays,
  Wallet,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOutAction } from "@/app/actions/auth";
import type { Role } from "@/models/User";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

/** Nav visibility is UX only — server-side RBAC is authoritative (PRD §39). */
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "hr", "manager", "artist", "finance"] },
  { href: "/employees", label: "Employees", icon: Users, roles: ["admin", "hr", "manager", "finance"] },
  { href: "/departments", label: "Departments", icon: Building2, roles: ["admin", "hr", "manager", "artist", "finance"] },
  // Sprint 2+ placeholders (hidden until built):
  // { href: "/attendance", ... }, { href: "/leave", ... }, { href: "/payroll", ... },
];

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  hr: "HR",
  manager: "Art Director",
  artist: "Artist",
  finance: "Finance",
};

export function Sidebar({
  user,
}: {
  user: { name: string; email: string; role: Role };
}) {
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">ArtFlow</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {/* Coming soon (Sprint 2+) — disabled placeholders */}
        {[
          { label: "Attendance", icon: CalendarDays },
          { label: "Payroll", icon: Wallet },
          { label: "Tasks", icon: ClipboardList },
        ].map((s) => (
          <span
            key={s.label}
            className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/40"
            title="Coming in a later sprint"
          >
            <s.icon className="h-4 w-4" />
            {s.label}
            <Badge variant="secondary" className="ml-auto text-[10px]">
              Soon
            </Badge>
          </span>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Badge variant="secondary" className="mt-1">
            {ROLE_LABEL[user.role]}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOutAction()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
