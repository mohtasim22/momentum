import type { UniqueIdentifier } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { TaskStatus } from "@/generated/prisma/enums";
import type { BoardColumnData } from "./types";

// Pure functions that take the board and return a new board. No React, no
// dnd-kit state: easy to read, easy to test (board-state.test.ts).

/** The column an id belongs to. The id is either a column's status or a task's id. */
export function findColumn(
  columns: BoardColumnData[],
  id: UniqueIdentifier,
): BoardColumnData | undefined {
  return (
    columns.find((column) => column.status === id) ??
    columns.find((column) => column.tasks.some((task) => task.id === id))
  );
}

/** Move a task into another column at `index`, updating its status to match. */
export function moveToColumn(
  columns: BoardColumnData[],
  taskId: UniqueIdentifier,
  toStatus: TaskStatus,
  index: number,
): BoardColumnData[] {
  const task = columns.flatMap((column) => column.tasks).find((t) => t.id === taskId);
  if (!task) return columns;

  return columns.map((column) => {
    const without = column.tasks.filter((t) => t.id !== taskId);
    if (column.status !== toStatus) {
      return without.length === column.tasks.length ? column : { ...column, tasks: without };
    }
    const tasks = [...without];
    tasks.splice(Math.min(index, tasks.length), 0, { ...task, status: toStatus });
    return { ...column, tasks };
  });
}

/** Within one column, move `activeId` to where `overId` is. */
export function reorderWithinColumn(
  columns: BoardColumnData[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
): BoardColumnData[] {
  if (activeId === overId) return columns;

  return columns.map((column) => {
    const from = column.tasks.findIndex((task) => task.id === activeId);
    const to = column.tasks.findIndex((task) => task.id === overId);
    if (from === -1 || to === -1) return column;
    return { ...column, tasks: arrayMove(column.tasks, from, to) };
  });
}
