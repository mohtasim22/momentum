"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "../actions";
import { signUpSchema } from "../schemas";
import { useSchemaValidation } from "@/hooks/use-schema-validation";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, {});
  const { clientErrors, validate } = useSchemaValidation(signUpSchema);

  const errors = clientErrors ?? state.fieldErrors;

  return (
    <form action={formAction} onSubmit={validate} noValidate className="grid gap-6">
      <FieldGroup>
        <Field data-invalid={!!errors?.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            defaultValue={state.values?.name}
            aria-invalid={!!errors?.name}
          />
          <FieldError>{errors?.name?.[0]}</FieldError>
        </Field>

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
            autoComplete="new-password"
            aria-invalid={!!errors?.password}
          />
          <FieldError>{errors?.password?.[0]}</FieldError>
        </Field>
      </FieldGroup>

      {state.formError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-status-overdue-bg px-3 py-2 text-sm text-destructive"
        >
          {state.formError}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
