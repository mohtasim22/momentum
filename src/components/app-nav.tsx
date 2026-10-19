"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/my-work", label: "My work" },
];

// The main navigation. A client component only because it highlights the
// current page, which needs the URL in the browser.
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm transition-colors hover:text-foreground",
              active ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
