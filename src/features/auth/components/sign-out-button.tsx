import { Button } from "@/components/ui/button";
import { signOut } from "../actions";

// A plain <form> pointing at a Server Action: no "use client", no JavaScript
// needed. It's a POST, so a link or an <img> on another site can't sign you out.
export function SignOutButton({ next }: { next?: string }) {
  return (
    <form action={signOut}>
      {next && <input type="hidden" name="next" value={next} />}
      <Button type="submit" variant="outline" size="sm">
        Sign out
      </Button>
    </form>
  );
}
