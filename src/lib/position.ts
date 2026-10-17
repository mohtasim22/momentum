import { generateKeyBetween } from "fractional-indexing";

// Task positions are fractional-index keys: strings like "a0" < "a0V" < "a1"
// that sort byte by byte (the task.position column is COLLATE "C").
// The rest of the app only talks to these two functions, so the library is
// used in exactly one place.

/** A position after `last`: the end of a column. Pass null for an empty column. */
export function positionAfter(last: string | null): string {
  return generateKeyBetween(last, null);
}

/**
 * A position strictly between two neighbours. null means "no neighbour on
 * that side" (top or bottom of the column). Throws if the neighbours are
 * equal or out of order: that's a bug in the caller, not something to guess
 * around.
 */
export function positionBetween(before: string | null, after: string | null): string {
  if (before !== null && after !== null && before >= after) {
    throw new Error(`positionBetween: "${before}" must sort before "${after}"`);
  }
  return generateKeyBetween(before, after);
}
