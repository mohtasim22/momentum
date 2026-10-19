import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

// Task positions are fractional-index keys: strings like "a0" < "a0V" < "a1"
// that sort byte by byte (the task.position column is COLLATE "C").
// The rest of the app only talks to these functions, so the library is
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

/**
 * Can a new key be placed between these neighbours? Not when they share a
 * position, which can happen when two people add a task to the same column
 * at the same moment (both read the same "last" position). Then the column
 * needs rebalancing instead.
 */
export function hasRoomBetween(before: string | null, after: string | null): boolean {
  return before === null || after === null || before < after;
}

/** `count` fresh, evenly spaced positions in ascending order ("a0", "a1", ...). */
export function freshPositions(count: number): string[] {
  return generateNKeysBetween(null, null, count);
}

/**
 * The column's task ids in their new order: `ids` (current order, without
 * the moved task) with `taskId` inserted right after `beforeId`, or at the
 * top when `beforeId` is null. An unknown `beforeId` puts the task at the
 * bottom rather than guessing.
 */
export function orderWithInsert(ids: string[], taskId: string, beforeId: string | null): string[] {
  const rest = ids.filter((id) => id !== taskId);
  let at = 0;
  if (beforeId !== null) {
    const index = rest.indexOf(beforeId);
    at = index === -1 ? rest.length : index + 1;
  }
  return [...rest.slice(0, at), taskId, ...rest.slice(at)];
}
