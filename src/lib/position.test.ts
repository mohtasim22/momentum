import { describe, expect, it } from "vitest";
import { positionAfter, positionBetween } from "./position";

// JavaScript's default string comparison (and .sort()) compares character
// codes, which for these ASCII keys is the same order as Postgres COLLATE "C".
function isStrictlySorted(keys: string[]) {
  return keys.every((key, i) => i === 0 || keys[i - 1] < key);
}

// A tiny seeded random number generator. Same seed, same numbers, every run,
// so a failing test fails the same way twice and can be debugged.
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe("positionAfter", () => {
  it("starts an empty column at a0", () => {
    expect(positionAfter(null)).toBe("a0");
  });

  it("keeps 1,000 appends in order", () => {
    const keys: string[] = [];
    for (let i = 0; i < 1000; i++) {
      keys.push(positionAfter(keys.at(-1) ?? null));
    }
    expect(isStrictlySorted(keys)).toBe(true);
  });
});

describe("positionBetween", () => {
  it("returns a key strictly between its neighbours", () => {
    const key = positionBetween("a0", "a1");
    expect("a0" < key && key < "a1").toBe(true);
  });

  it("handles the top and bottom of a column", () => {
    expect(positionBetween(null, "a0") < "a0").toBe(true);
    expect(positionBetween("a0", null) > "a0").toBe(true);
  });

  it("survives 500 inserts into the same gap", () => {
    // Worst case: always drop a card directly below the top card
    const top = "a0";
    let below = "a1";
    for (let i = 0; i < 500; i++) {
      const key = positionBetween(top, below);
      expect(top < key && key < below).toBe(true);
      below = key;
    }
    // Keys grow, but slowly: about one character per six inserts
    expect(below.length).toBeLessThan(100);
  });

  it("keeps a column sorted through 300 random moves", () => {
    const random = seededRandom(42);
    const column = [positionAfter(null)];

    for (let i = 0; i < 300; i++) {
      // Pick a gap: 0 = above the first card, column.length = below the last
      const gap = Math.floor(random() * (column.length + 1));
      const before = column[gap - 1] ?? null;
      const after = column[gap] ?? null;
      column.splice(gap, 0, positionBetween(before, after));
    }

    expect(isStrictlySorted(column)).toBe(true);
    expect(new Set(column).size).toBe(column.length);
  });

  it("rejects neighbours that are equal or out of order", () => {
    expect(() => positionBetween("a1", "a1")).toThrow(/must sort before/);
    expect(() => positionBetween("a1", "a0")).toThrow(/must sort before/);
  });
});
