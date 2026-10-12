"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSchemaValidation } from "@/hooks/use-schema-validation";
import { createProject } from "../actions";
import { createProjectSchema } from "../schemas";

export function CreateProjectForm() {
  const [state, formAction, pending] = useActionState(createProject, {});
  const { clientErrors, validate } = useSchemaValidation(createProjectSchema);

  const errors = clientErrors ?? state.fieldErrors;

  return (
    <form action={formAction} onSubmit={validate} noValidate className="grid gap-3">
      <Field data-invalid={!!errors?.name}>
        <FieldLabel htmlFor="project-name">New project</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="project-name"
            name="name"
            placeholder="e.g. Website relaunch"
            autoComplete="off"
            defaultValue={state.values?.name}
            aria-invalid={!!errors?.name}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create project"}
          </Button>
        </div>
        <FieldError>{errors?.name?.[0]}</FieldError>
      </Field>

      {state.ok && state.message && (
        <p role="status" className="text-sm text-status-done">
          {state.message}
        </p>
      )}
    </form>
  );
}
