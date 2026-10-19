"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signInDemo } from "../actions";

type Props = Pick<React.ComponentProps<typeof Button>, "size" | "variant" | "className">;

// A one-click way in for visitors (and recruiters) who just want to look around
export function DemoSignInButton(props: Props) {
  const [state, formAction, pending] = useActionState(signInDemo, {});

  return (
    <form action={formAction} className="grid gap-2">
      <Button type="submit" disabled={pending} {...props}>
        {pending ? "Opening the demo…" : "Explore the demo"}
      </Button>
      {state.formError && (
        <p role="alert" className="text-sm text-destructive">
          {state.formError}
        </p>
      )}
    </form>
  );
}
