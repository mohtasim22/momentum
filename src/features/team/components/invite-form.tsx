"use client";

import { Copy } from "lucide-react";
import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Role } from "@/generated/prisma/enums";
import { useSchemaValidation } from "@/hooks/use-schema-validation";
import { inviteMember } from "../actions";
import { ROLE_LABEL } from "../roles";
import { inviteSchema } from "../schemas";

type Props = {
  projectId: string;
  // Only the roles this person may hand out (worked out on the server)
  roles: Role[];
};

export function InviteForm({ projectId, roles }: Props) {
  const [state, formAction, pending] = useActionState(inviteMember.bind(null, projectId), {});
  const { clientErrors, validate } = useSchemaValidation(inviteSchema);
  const errors = clientErrors ?? state.fieldErrors;

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it by hand.");
    }
  }

  return (
    <form action={formAction} onSubmit={validate} noValidate className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-start">
        <Field data-invalid={!!errors?.email}>
          <FieldLabel htmlFor="invite-email">Email</FieldLabel>
          <Input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="off"
            placeholder="teammate@example.com"
            defaultValue={state.values?.email}
            aria-invalid={!!errors?.email}
          />
          <FieldError>{errors?.email?.[0]}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.role}>
          <FieldLabel htmlFor="invite-role">Role</FieldLabel>
          <NativeSelect id="invite-role" name="role" defaultValue={roles.at(-1)} className="w-full">
            {roles.map((role) => (
              <NativeSelectOption key={role} value={role}>
                {ROLE_LABEL[role]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{errors?.role?.[0]}</FieldError>
        </Field>

        <Button type="submit" disabled={pending} className="sm:mt-6">
          {pending ? "Inviting…" : "Send invite"}
        </Button>
      </div>

      {state.formError && (
        <p role="alert" className="text-sm text-destructive">
          {state.formError}
        </p>
      )}

      {state.ok && state.inviteUrl && (
        <div role="status" className="grid gap-2 rounded-md border bg-secondary p-3 text-sm">
          <p className="text-status-done">{state.message}</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink-2">
              {state.inviteUrl}
            </code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyLink(state.inviteUrl!)}
            >
              <Copy data-icon="inline-start" />
              Copy link
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
