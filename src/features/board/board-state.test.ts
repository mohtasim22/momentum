import { describe, expect, it } from "vitest";
import { findColumn, moveToColumn, reorderWithinColumn } from "./board-state";
import type { BoardColumnData, BoardTask } from "./types";

function task(id: string, status: BoardTask["status"]): BoardTask {
  return {
    id,
    title: id,
    description: null,
    status,
    priority: "MEDIUM",
    dueDate: null,
    canDelete: true,
  };
}

// Todo: a, b, c · In progress: d · In review: (empty) · Done: (empty)
function board(): BoardColumnData[] {
  return [
    {
      status: "TODO",
      label: "Todo",
      badge: "",
      tasks: [task("a", "TODO"), task("b", "TODO"), task("c", "TODO")],
    },
    { status: "IN_PROGRESS", label: "In progress", badge: "", tasks: [task("d", "IN_PROGRESS")] },
    { status: "IN_REVIEW", label: "In review", badge: "", tasks: [] },
    { status: "DONE", label: "Done", badge: "", tasks: [] },
  ];
}

const ids = (columns: BoardColumnData[], status: string) =>
  columns.find((column) => column.status === status)!.tasks.map((t) => t.id);

describe("findColumn", () => {
  it("finds a column by its own id (an empty column is a drop target too)", () => {
    expect(findColumn(board(), "IN_REVIEW")?.status).toBe("IN_REVIEW");
  });

  it("finds the column that contains a task", () => {
    expect(findColumn(board(), "d")?.status).toBe("IN_PROGRESS");
  });

  it("returns undefined for an unknown id", () => {
    expect(findColumn(board(), "nope")).toBeUndefined();
  });
});

describe("moveToColumn", () => {
  it("moves a task between columns at the given index and updates its status", () => {
    const next = moveToColumn(board(), "a", "IN_PROGRESS", 0);
    expect(ids(next, "TODO")).toEqual(["b", "c"]);
    expect(ids(next, "IN_PROGRESS")).toEqual(["a", "d"]);
    expect(next[1].tasks[0].status).toBe("IN_PROGRESS");
  });

  it("drops into an empty column", () => {
    const next = moveToColumn(board(), "c", "DONE", 0);
    expect(ids(next, "DONE")).toEqual(["c"]);
  });

  it("clamps an index past the end to the end", () => {
    const next = moveToColumn(board(), "a", "IN_PROGRESS", 99);
    expect(ids(next, "IN_PROGRESS")).toEqual(["d", "a"]);
  });

  it("never duplicates or loses a task", () => {
    const next = moveToColumn(board(), "b", "IN_REVIEW", 0);
    const all = next.flatMap((column) => column.tasks.map((t) => t.id)).sort();
    expect(all).toEqual(["a", "b", "c", "d"]);
  });

  it("does not change the board it was given", () => {
    const before = board();
    moveToColumn(before, "a", "DONE", 0);
    expect(ids(before, "TODO")).toEqual(["a", "b", "c"]);
  });
});

describe("reorderWithinColumn", () => {
  it("moves a card to the position of the card it was dropped on", () => {
    expect(ids(reorderWithinColumn(board(), "c", "a"), "TODO")).toEqual(["c", "a", "b"]);
    expect(ids(reorderWithinColumn(board(), "a", "c"), "TODO")).toEqual(["b", "c", "a"]);
  });

  it("ignores ids from different columns", () => {
    const before = board();
    expect(reorderWithinColumn(before, "a", "d")).toEqual(before);
  });
});
