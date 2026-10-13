"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteProject } from "../actions";

type Props = {
  projectId: string;
  projectName: string;
};

export function DeleteProjectForm({ projectId, projectName }: Props) {
  const [state, formAction, pending] = useActionState(deleteProject.bind(null, projectId), {});
  // Controlled input: the button stays disabled until the name matches.
  // This is only a speed bump for the UI; the server checks again.
  const [typed, setTyped] = useState("");

  const error = state.fieldErrors?.confirmName?.[0] ?? state.formError;

  return (
    <form action={formAction} className="grid gap-3">
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor="confirm-name">Type the project name to confirm</FieldLabel>
        <FieldDescription>
          This deletes <strong className="text-foreground">{projectName}</strong> for everyone. It can&apos;t be
          undone.
        </FieldDescription>
        <Input
          id="confirm-name"
          name="confirmName"
          autoComplete="off"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          aria-invalid={!!error}
        />
        <FieldError>{error}</FieldError>
      </Field>

      <Button
        type="submit"
        variant="destructive"
        disabled={pending || typed.trim() !== projectName}
        className="justify-self-start"
      >
        {pending ? "Deleting…" : "Delete project"}
      </Button>
    </form>
  );
}
