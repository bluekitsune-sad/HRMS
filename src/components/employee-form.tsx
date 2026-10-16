"use client";

import { useActionState } from "react";
import { createEmployee, updateEmployee, type ActionState } from "@/app/(dashboard)/employees/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Dept = { _id: string; name: string };

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "hr", label: "HR" },
  { value: "manager", label: "Manager / Art Director" },
  { value: "artist", label: "Artist" },
  { value: "finance", label: "Finance" },
];

export function EmployeeForm({
  departments,
  employeeId,
  defaults,
}: {
  departments: Dept[];
  employeeId?: string;
  defaults?: {
    name: string;
    email: string;
    phone?: string;
    position?: string;
    departmentId?: string;
    joiningDate?: string;
    employmentType: string;
    status: string;
    role: string;
    monthlySalary?: number | null;
    skills?: string[];
  };
}) {
  const bound = updateEmployee.bind(null, employeeId ?? "");
  const action = employeeId ? bound : createEmployee;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={state?.errors?.name}>
            <Input name="name" defaultValue={defaults?.name} required />
          </Field>
          <Field label="Email" error={state?.errors?.email}>
            <Input name="email" type="email" defaultValue={defaults?.email} required />
          </Field>
          <Field label="Phone" error={state?.errors?.phone}>
            <Input name="phone" defaultValue={defaults?.phone} />
          </Field>
          <Field label="Position" error={state?.errors?.position}>
            <Input name="position" defaultValue={defaults?.position} placeholder="Character Artist" />
          </Field>
          <Field label="Department" error={state?.errors?.departmentId}>
            <Select name="departmentId" defaultValue={defaults?.departmentId ?? ""}>
              <option value="">— None —</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Joining date" error={state?.errors?.joiningDate}>
            <Input
              name="joiningDate"
              type="date"
              defaultValue={
                defaults?.joiningDate
                  ? new Date(defaults.joiningDate).toISOString().slice(0, 10)
                  : ""
              }
            />
          </Field>
          <Field label="Employment type" error={state?.errors?.employmentType}>
            <Select name="employmentType" defaultValue={defaults?.employmentType ?? "full-time"}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </Select>
          </Field>
          <Field label="Status" error={state?.errors?.status}>
            <Select name="status" defaultValue={defaults?.status ?? "active"}>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="on-leave">On leave</option>
              <option value="resigned">Resigned</option>
              <option value="terminated">Terminated</option>
            </Select>
          </Field>
          <Field label="Access role" error={state?.errors?.role}>
            <Select name="role" defaultValue={defaults?.role ?? "artist"}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Monthly salary" error={state?.errors?.monthlySalary}>
            <Input
              name="monthlySalary"
              type="number"
              min={0}
              defaultValue={defaults?.monthlySalary ?? ""}
              placeholder="120000"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Skills (comma-separated)" error={state?.errors?.skills}>
              <Input
                name="skills"
                defaultValue={defaults?.skills?.join(", ")}
                placeholder="Character Art, Illustration, Photoshop"
              />
            </Field>
          </div>

          {!employeeId && (
            <div className="space-y-3 rounded-md border bg-muted/40 p-4 sm:col-span-2">
              <p className="text-sm font-medium">Login account (optional)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password (min 8 chars)">
                  <Input name="password" type="password" minLength={8} />
                </Field>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input type="checkbox" name="createAccount" className="h-4 w-4 rounded border-input" />
                  Create login account with this role
                </label>
              </div>
            </div>
          )}

          {state?.message && (
            <p
              className={`sm:col-span-2 rounded-md px-3 py-2 text-sm ${
                state.ok
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : employeeId
                  ? "Save changes"
                  : "Create employee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
