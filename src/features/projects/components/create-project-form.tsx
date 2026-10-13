"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSchemaValidation } from "@/hooks/use-schema-validation";
import { createProject } from "../actions";
import { CreateProjectInput, createProjectSchema } from "../schemas";
import { FormState } from "@/lib/form-state";

type Props = {
  // Called after the server confirms the project exists
  onCreated?: () => void;
};

export function CreateProjectForm({ onCreated }: Props) {
  const [state, formAction, pending] = useActionState(
    async (prevState: FormState<CreateProjectInput>, formData: FormData) => {
      const result = await createProject(prevState, formData);
      if (result.ok) onCreated?.();
      return result;
    },
    {},
  );
  const { clientErrors, validate } = useSchemaValidation(createProjectSchema);

  const errors = clientErrors ?? state.fieldErrors;

  return (
    <form
      action={formAction}
      onSubmit={validate}
      noValidate
      className="grid gap-3"
    >
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
        </div>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}
