import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { AcceptInviteButton } from "@/features/team/components/accept-invite-button";
import { getInvite } from "@/features/team/queries";
import { ROLE_LABEL } from "@/features/team/roles";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Invitation",
  // The token is in the URL: keep it out of search engines and out of the
  // Referer header sent to any site linked from this page
  robots: { index: false },
  referrer: "no-referrer",
};

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const [invite, session] = await Promise.all([getInvite(token), getSession()]);

  if (!invite || !invite.usable) {
    return (
      <Card title="This invite isn't valid">
        <p className="text-sm text-muted-foreground">
          It may have expired, been revoked, or already been used. Ask whoever invited you to send a
          new one.
        </p>
        <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
          Go to your projects
        </Link>
      </Card>
    );
  }

  const intro = (
    <p className="text-sm text-muted-foreground">
      {invite.invitedBy?.name ?? "Someone"} invited{" "}
      <strong className="text-foreground">{invite.email}</strong> to join{" "}
      <strong className="text-foreground">{invite.project.name}</strong> as{" "}
      {ROLE_LABEL[invite.role].toLowerCase()}.
    </p>
  );

  if (!session) {
    const next = encodeURIComponent(`/invite/${token}`);
    return (
      <Card title={`Join ${invite.project.name}`}>
        {intro}
        <p className="text-sm text-muted-foreground">
          Sign in or create an account with that email to accept.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link href={`/sign-up?next=${next}`} className={buttonVariants()}>
            Create account
          </Link>
          <Link href={`/sign-in?next=${next}`} className={buttonVariants({ variant: "outline" })}>
            Sign in
          </Link>
        </div>
      </Card>
    );
  }

  if (session.user.email.toLowerCase() !== invite.email) {
    return (
      <Card title="Wrong account">
        {intro}
        <p className="text-sm text-muted-foreground">
          You&apos;re signed in as <strong className="text-foreground">{session.user.email}</strong>
          . Sign out, then sign in with {invite.email} to accept.
        </p>
        <SignOutButton next={`/invite/${token}`} />
      </Card>
    );
  }

  return (
    <Card title={`Join ${invite.project.name}`}>
      {intro}
      <AcceptInviteButton token={token} projectName={invite.project.name} />
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <p className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Momentum · invitation
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children}
    </div>
  );
}
