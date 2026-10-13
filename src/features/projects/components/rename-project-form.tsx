"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSchemaValidation } from "@/hooks/use-schema-validation";
import { renameProject } from "../actions";
import { renameProjectSchema } from "../schemas";

type Props = {
  projectId: string;
  currentName: string;
};

export function RenameProjectForm({ projectId, currentName }: Props) {
  // .bind(null, projectId) makes a new function with projectId already
  // filled in as the first argument, so the action knows which project.
  const [state, formAction, pending] = useActionState(renameProject.bind(null, projectId), {});
  const { clientErrors, validate } = useSchemaValidation(renameProjectSchema);

  const errors = clientErrors ?? state.fieldErrors;

  return (
    <form action={formAction} onSubmit={validate} noValidate className="grid gap-3">
      <Field data-invalid={!!errors?.name}>
        <FieldLabel htmlFor="project-name">Project name</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="project-name"
            name="name"
            autoComplete="off"
            defaultValue={state.values?.name ?? currentName}
            aria-invalid={!!errors?.name}
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
        <FieldError>{errors?.name?.[0]}</FieldError>
      </Field>

      {state.formError && (
        <p role="alert" className="text-sm text-destructive">
          {state.formError}
        </p>
      )}
      {state.ok && state.message && (
        <p role="status" className="text-sm text-status-done">
          {state.message}
        </p>
      )}
    </form>
  );
}
