"use client";

import {
  closestCorners,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { useId, useState, useTransition } from "react";
import { moveTask } from "@/features/tasks/actions";
import { findColumn, moveToColumn, reorderWithinColumn, sameSpot, spotOf } from "../board-state";
import type { BoardColumnData } from "../types";
import { BoardColumn } from "./board-column";

type Props = {
  projectId: string;
  columns: BoardColumnData[];
};

export function Board({ projectId, columns: serverColumns }: Props) {
  // Local copy of the board, so a drop can reorder cards instantly.
  const [columns, setColumns] = useState(serverColumns);
  // The board as it was when the drag began, to restore if it's cancelled
  const [beforeDrag, setBeforeDrag] = useState<BoardColumnData[] | null>(null);

  // When the server sends a fresh board (after adding or editing a task),
  // start again from it. This is React's "adjust state when a prop changes"
  // pattern: compare during render, no useEffect needed.
  const [lastServerColumns, setLastServerColumns] = useState(serverColumns);
  if (serverColumns !== lastServerColumns) {
    setLastServerColumns(serverColumns);
    setColumns(serverColumns);
  }

  const sensors = useSensors(
    // Mouse: start dragging after 5px of movement, so a plain click
    // still opens the task dialog
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // Touch: press and hold briefly, so a swipe still scrolls the board
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const [, startTransition] = useTransition();

  // A stable id stops server and browser from generating different
  // accessibility ids (a hydration mismatch)
  const dndId = useId();

  function handleDragStart() {
    setBeforeDrag(columns);
  }

  // Fires continuously while dragging. As soon as the card is over another
  // column, move it there, so that column opens a gap for it.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;

    setColumns((current) => {
      const from = findColumn(current, active.id);
      const to = findColumn(current, over.id);
      if (!from || !to || from.status === to.status) return current;

      // Over the column itself (e.g. an empty one): go to the end.
      // Over a card: take its slot, or the slot after it if the dragged
      // card's middle is below that card's middle.
      let index = to.tasks.length;
      const overIndex = to.tasks.findIndex((task) => task.id === over.id);
      if (overIndex !== -1) {
        const dragged = active.rect.current.translated;
        const draggedMiddle = dragged ? dragged.top + dragged.height / 2 : 0;
        const isBelow = draggedMiddle > over.rect.top + over.rect.height / 2;
        index = overIndex + (isBelow ? 1 : 0);
      }
      return moveToColumn(current, active.id, to.status, index);
    });
  }

  // The card is already in the right column (handleDragOver); settle its
  // position inside that column, then tell the server where it landed.
  function handleDragEnd({ active, over }: DragEndEvent) {
    const snapshot = beforeDrag;
    setBeforeDrag(null);
    if (!over || !snapshot) return;

    const next = reorderWithinColumn(columns, active.id, over.id);
    setColumns(next);

    const spot = spotOf(next, active.id);
    // Dropped exactly where it started: nothing to save
    if (!spot || sameSpot(spotOf(snapshot, active.id), spot)) return;

    startTransition(async () => {
      const result = await moveTask(projectId, { taskId: String(active.id), ...spot });
      // The server said no: put the board back as it was (a toast comes in 4.4)
      if (result.error) setColumns(snapshot);
    });
  }

  // Escape pressed, or dropped somewhere invalid: put everything back
  function handleDragCancel() {
    if (beforeDrag) setColumns(beforeDrag);
    setBeforeDrag(null);
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 lg:grid lg:grid-cols-4">
        {columns.map((column) => (
          <BoardColumn key={column.status} projectId={projectId} {...column} />
        ))}
      </div>
    </DndContext>
  );
}
