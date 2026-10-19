"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma/enums";
import { formatDateOnly } from "@/lib/dates";
import { revokeInvite } from "../actions";
import { ROLE_LABEL } from "../roles";

type Props = {
  projectId: string;
  inviteId: string;
  email: string;
  role: Role;
  expiresAt: string;
  canRevoke: boolean;
};

export function PendingInviteRow({
  projectId,
  inviteId,
  email,
  role,
  expiresAt,
  canRevoke,
}: Props) {
  const [pending, startTransition] = useTransition();

  function handleRevoke() {
    startTransition(async () => {
      const { error } = await revokeInvite(projectId, inviteId);
      if (error) toast.error(error);
      else toast.success(`Invite for ${email} revoked.`);
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate">{email}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {ROLE_LABEL[role]} · expires {formatDateOnly(expiresAt.slice(0, 10))}
        </p>
      </div>
      {canRevoke && (
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={handleRevoke}>
          {pending ? "Revoking…" : "Revoke"}
        </Button>
      )}
    </li>
  );
}
