"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { TaskStatus } from "@/generated/prisma/enums";
import { useSchemaValidation } from "@/hooks/use-schema-validation";
import { createTask } from "../actions";
import { createTaskSchema } from "../schemas";

type Props = {
  projectId: string;
  status: TaskStatus;
  columnLabel: string;
};

export function AddTaskForm({ projectId, status, columnLabel }: Props) {
  const [state, formAction, pending] = useActionState(createTask.bind(null, projectId), {});
  const { clientErrors, validate } = useSchemaValidation(createTaskSchema);

  const errors = clientErrors ?? state.fieldErrors;
  const inputId = `new-task-${status}`;

  return (
    <form action={formAction} onSubmit={validate} noValidate className="grid gap-2">
      <input type="hidden" name="status" value={status} />
      <Field data-invalid={!!errors?.title}>
        <FieldLabel htmlFor={inputId} className="sr-only">
          New task in {columnLabel}
        </FieldLabel>
        <div className="flex gap-2">
          <Input
            id={inputId}
            name="title"
            placeholder="Add a task"
            autoComplete="off"
            defaultValue={state.values?.title}
            aria-invalid={!!errors?.title}
          />
          <Button
            type="submit"
            size="icon"
            variant="outline"
            disabled={pending}
            aria-label={`Add task to ${columnLabel}`}
          >
            <Plus />
          </Button>
        </div>
        <FieldError>{errors?.title?.[0] ?? errors?.status?.[0]}</FieldError>
      </Field>
    </form>
  );
}
