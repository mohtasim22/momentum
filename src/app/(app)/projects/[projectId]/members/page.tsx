import type { Metadata } from "next";
import Link from "next/link";
import { InviteForm } from "@/features/team/components/invite-form";
import { MemberRow } from "@/features/team/components/member-row";
import { PendingInviteRow } from "@/features/team/components/pending-invite-row";
import { getTeam } from "@/features/team/queries";
import { ROLE_ORDER } from "@/features/team/roles";
import { requireMembership } from "@/lib/authz";
import { can, canChangeRole, canRemoveMember, invitableRoles } from "@/lib/permissions";

export async function generateMetadata({
  params,
}: PageProps<"/projects/[projectId]/members">): Promise<Metadata> {
  const { projectId } = await params;
  const { project } = await requireMembership(projectId);
  return { title: `Members · ${project.name}` };
}

export default async function MembersPage({ params }: PageProps<"/projects/[projectId]/members">) {
  const { projectId } = await params;
  const { project, me, members, invites } = await getTeam(projectId);
  const canInvite = can(me.role, "members:invite");

  return (
    <div className="grid max-w-3xl gap-8">
      <div className="grid gap-1">
        <Link
          href={`/projects/${project.id}`}
          className="w-fit font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase hover:text-foreground"
        >
          ← {project.name}
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Members</h1>
      </div>

      {canInvite && (
        <section className="grid gap-3 rounded-lg border bg-card p-4">
          <h2 className="font-medium">Invite someone</h2>
          <InviteForm projectId={project.id} roles={invitableRoles(me.role)} />
        </section>
      )}

      <section className="grid gap-3">
        <h2 className="font-medium">
          People <span className="font-mono text-xs text-muted-foreground">{members.length}</span>
        </h2>
        <ul className="divide-y rounded-lg border bg-card">
          {members.map((member) => {
            const isSelf = member.userId === me.userId;
            // The roles this person could be given, including the one they have
            const roleOptions = ROLE_ORDER.filter(
              (role) => role === member.role || canChangeRole(me.role, member.role, role),
            );
            return (
              <MemberRow
                key={member.membershipId}
                projectId={project.id}
                membershipId={member.membershipId}
                name={member.name}
                email={member.email}
                role={member.role}
                isSelf={isSelf}
                roleOptions={roleOptions}
                canRemove={canRemoveMember(me.role, member.role, isSelf)}
              />
            );
          })}
        </ul>
      </section>

      {invites.length > 0 && (
        <section className="grid gap-3">
          <h2 className="font-medium">
            Pending invites{" "}
            <span className="font-mono text-xs text-muted-foreground">{invites.length}</span>
          </h2>
          <ul className="divide-y rounded-lg border bg-card">
            {invites.map((invite) => (
              <PendingInviteRow
                key={invite.id}
                projectId={project.id}
                inviteId={invite.id}
                email={invite.email}
                role={invite.role}
                expiresAt={invite.expiresAt}
                canRevoke={canInvite}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
