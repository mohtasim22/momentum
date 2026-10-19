import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const next = safeNextPath((await searchParams).next) ?? undefined;

  // Already signed in? Skip the form. This is a real session check, not just
  // "is there a cookie", so an expired cookie can't cause a redirect loop.
  if (await getSession()) {
    redirect(next ?? "/projects");
  }
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <p className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Momentum
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ll start your first project right after.
        </p>
      </div>
      <SignUpForm next={next} />
    </div>
  );
}
