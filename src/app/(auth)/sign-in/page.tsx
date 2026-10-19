import type { Metadata } from "next";
import { DemoSignInButton } from "@/features/auth/components/demo-sign-in-button";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { demoAvailable } from "@/features/auth/demo";
import { safeNextPath } from "@/lib/safe-redirect";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
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
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Your boards are where you left them.
        </p>
      </div>
      <SignInForm next={next} />
      {demoAvailable() && !next && (
        <div className="grid gap-3 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">Just looking around?</p>
          <DemoSignInButton variant="outline" className="w-full" />
        </div>
      )}
    </div>
  );
}
