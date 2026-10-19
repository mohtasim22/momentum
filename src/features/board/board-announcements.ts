import type { Announcements, UniqueIdentifier } from "@dnd-kit/core";
import type { BoardColumnData } from "./types";

// What a screen reader says during a drag. dnd-kit's defaults read out raw
// ids ("Picked up draggable item cm1x9…"), so describe cards by title and
// place them by column and position instead.

/** "Todo, position 2 of 5", or "the Done column" for an empty column. */
export function describePlace(columns: BoardColumnData[], id: UniqueIdentifier): string {
  for (const column of columns) {
    if (column.status === id) return `the ${column.label} column`;
    const index = column.tasks.findIndex((task) => task.id === id);
    if (index !== -1) return `${column.label}, position ${index + 1} of ${column.tasks.length}`;
  }
  return "the board";
}

function titleOf(columns: BoardColumnData[], id: UniqueIdentifier): string {
  return columns.flatMap((column) => column.tasks).find((task) => task.id === id)?.title ?? "Task";
}

// Built from the current board on every render, so it always reads fresh data
export function boardAnnouncements(columns: BoardColumnData[]): Announcements {
  return {
    onDragStart({ active }) {
      return `Picked up ${titleOf(columns, active.id)}, in ${describePlace(columns, active.id)}.`;
    },
    onDragOver({ active, over }) {
      if (!over) return `${titleOf(columns, active.id)} is not over a column.`;
      return `${titleOf(columns, active.id)} is over ${describePlace(columns, over.id)}.`;
    },
    onDragEnd({ active, over }) {
      if (!over) return `${titleOf(columns, active.id)} was dropped outside the board.`;
      return `${titleOf(columns, active.id)} dropped at ${describePlace(columns, over.id)}.`;
    },
    onDragCancel({ active }) {
      return `Moving cancelled. ${titleOf(columns, active.id)} is back where it started.`;
    },
  };
}

export const screenReaderInstructions = {
  draggable:
    "To move this task, press Space. Use the arrow keys to move it within a column or to another column. Press Space again to drop it, or Escape to cancel.",
};
