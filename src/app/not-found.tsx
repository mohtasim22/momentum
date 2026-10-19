import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Any URL that doesn't exist at all
export default function NotFound() {
  return (
    <main className="grid flex-1 place-items-center px-4 py-24 text-center">
      <div className="grid justify-items-center gap-3">
        <p className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          404
        </p>
        <h1 className="text-xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Check the address, or head back to somewhere that does.
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
