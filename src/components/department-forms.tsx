"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  createDepartment,
  deleteDepartment,
  type ActionState,
} from "@/app/(dashboard)/departments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DepartmentForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createDepartment,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="dept-name">Name</Label>
        <Input id="dept-name" name="name" placeholder="e.g. Concept Art" required />
        {state?.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dept-desc">Description</Label>
        <Input
          id="dept-desc"
          name="description"
          placeholder="Optional"
          className="w-72"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add department"}
      </Button>
      {state?.message && (
        <p className={state.ok ? "text-sm text-success" : "text-sm text-destructive"}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function DeleteDepartmentButton({ id, name }: { id: string; name: string }) {
  const actionWithId = async () => {
    await deleteDepartment(id);
  };
  return (
    <form action={actionWithId}>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        title={`Delete department ${name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
