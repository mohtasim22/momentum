"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { COLUMNS } from "@/features/board/columns";
import type { BoardTask } from "@/features/board/types";
import { useSchemaValidation } from "@/hooks/use-schema-validation";
import type { FormState } from "@/lib/form-state";
import { updateTask } from "../actions";
import { updateTaskSchema, type UpdateTaskInput } from "../schemas";

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

type Props = {
  projectId: string;
  task: BoardTask;
  onSaved?: () => void;
};

export function EditTaskForm({ projectId, task, onSaved }: Props) {
  const [state, formAction, pending] = useActionState(
    async (prevState: FormState<UpdateTaskInput>, formData: FormData) => {
      const result = await updateTask(projectId, task.id, prevState, formData);
      if (result.ok) onSaved?.();
      return result;
    },
    {},
  );
  const { clientErrors, validate } = useSchemaValidation(updateTaskSchema);

  const errors = clientErrors ?? state.fieldErrors;
  // After a failed save, show what the user typed; otherwise the saved task
  const values = state.values ?? {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? "",
  };

  return (
    <form action={formAction} onSubmit={validate} noValidate className="grid gap-4">
      <FieldGroup>
        <Field data-invalid={!!errors?.title}>
          <FieldLabel htmlFor="task-title">Title</FieldLabel>
          <Input
            id="task-title"
            name="title"
            autoComplete="off"
            defaultValue={values.title}
            aria-invalid={!!errors?.title}
          />
          <FieldError>{errors?.title?.[0]}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.description}>
          <FieldLabel htmlFor="task-description">Description</FieldLabel>
          <Textarea
            id="task-description"
            name="description"
            rows={4}
            defaultValue={values.description}
            aria-invalid={!!errors?.description}
          />
          <FieldError>{errors?.description?.[0]}</FieldError>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field data-invalid={!!errors?.status}>
            <FieldLabel htmlFor="task-status">Column</FieldLabel>
            <NativeSelect
              id="task-status"
              name="status"
              defaultValue={values.status}
              className="w-full"
            >
              {COLUMNS.map((column) => (
                <NativeSelectOption key={column.status} value={column.status}>
                  {column.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError>{errors?.status?.[0]}</FieldError>
          </Field>

          <Field data-invalid={!!errors?.priority}>
            <FieldLabel htmlFor="task-priority">Priority</FieldLabel>
            <NativeSelect
              id="task-priority"
              name="priority"
              defaultValue={values.priority}
              className="w-full"
            >
              {PRIORITIES.map((priority) => (
                <NativeSelectOption key={priority.value} value={priority.value}>
                  {priority.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError>{errors?.priority?.[0]}</FieldError>
          </Field>

          <Field data-invalid={!!errors?.dueDate}>
            <FieldLabel htmlFor="task-due">Due date</FieldLabel>
            <Input
              id="task-due"
              name="dueDate"
              type="date"
              defaultValue={values.dueDate}
              aria-invalid={!!errors?.dueDate}
            />
            <FieldError>{errors?.dueDate?.[0]}</FieldError>
          </Field>
        </div>
      </FieldGroup>

      <Button type="submit" disabled={pending} className="justify-self-end">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
