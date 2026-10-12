"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "../actions";
import { signInSchema, type SignInState } from "../schemas";

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, {});
  const [clientErrors, setClientErrors] = useState<SignInState["fieldErrors"]>();

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const result = signInSchema.safeParse(data);
    if (!result.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(result.error).fieldErrors);
    } else {
      setClientErrors(undefined);
    }
  }

  const errors = clientErrors ?? state.fieldErrors;

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="grid gap-6">
      <FieldGroup>
        <Field data-invalid={!!errors?.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            aria-invalid={!!errors?.email}
          />
          <FieldError>{errors?.email?.[0]}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors?.password}
          />
          <FieldError>{errors?.password?.[0]}</FieldError>
        </Field>
      </FieldGroup>

      {state.formError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-status-overdue-bg px-3 py-2 text-sm text-destructive">
          {state.formError}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to Momentum?{" "}
        <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
