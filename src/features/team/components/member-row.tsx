"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Role } from "@/generated/prisma/enums";
import { changeRole, removeMember } from "../actions";
import { ROLE_LABEL } from "../roles";

type Props = {
  projectId: string;
  membershipId: string;
  name: string;
  email: string;
  role: Role;
  isSelf: boolean;
  // Worked out on the server with the same rules the actions use
  roleOptions: Role[];
  canRemove: boolean;
};

export function MemberRow({
  projectId,
  membershipId,
  name,
  email,
  role,
  isSelf,
  roleOptions,
  canRemove,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function handleRoleChange(next: Role) {
    startTransition(async () => {
      const { error } = await changeRole(projectId, membershipId, next);
      if (error) toast.error(error);
      else toast.success(`${name} is now ${ROLE_LABEL[next].toLowerCase()}.`);
    });
  }

  function handleRemove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await removeMember(projectId, membershipId);
      // Leaving redirects; removing someone else returns here
      if (result?.error) toast.error(result.error);
      else toast.success(`${name} was removed.`);
      setConfirming(false);
    });
  }

  const removeLabel = isSelf ? "Leave project" : "Remove";

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium">
          {name} {isSelf && <span className="text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">{email}</p>
      </div>

      <div className="flex items-center gap-2">
        {roleOptions.length > 1 ? (
          <NativeSelect
            aria-label={`Role for ${name}`}
            value={role}
            disabled={pending}
            onChange={(event) => handleRoleChange(event.target.value as Role)}
            size="sm"
          >
            {roleOptions.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {ROLE_LABEL[option]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : (
          <span className="rounded-sm bg-secondary px-2 py-1 font-mono text-xs text-ink-2">
            {ROLE_LABEL[role]}
          </span>
        )}

        {canRemove && (
          <Button
            type="button"
            size="sm"
            variant={confirming ? "destructive" : "ghost"}
            disabled={pending}
            onClick={handleRemove}
            onBlur={() => setConfirming(false)}
          >
            {confirming ? `Click again to ${removeLabel.toLowerCase()}` : removeLabel}
          </Button>
        )}
      </div>
    </li>
  );
}
