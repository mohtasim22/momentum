import { useSyncExternalStore } from "react";

// "Today" as the viewer's own calendar date ("2026-10-20"), which only the
// browser knows. On the server, and during hydration, it's null, so server
// and browser render the same HTML; right after hydration React re-renders
// with the real date. No hydration mismatch, no useEffect.
const subscribe = () => () => {};
const localToday = () => new Date().toLocaleDateString("en-CA"); // en-CA formats as YYYY-MM-DD

export function useToday(): string | null {
  return useSyncExternalStore(subscribe, localToday, () => null);
}
