import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Momentum
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Your boards are where you left them.</p>
      </div>
      <SignInForm />
    </div>
  );
}
