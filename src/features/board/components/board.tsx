"use client";

import {
  closestCenter,
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useId, useState } from "react";
import type { BoardColumnData } from "../types";
import { BoardColumn } from "./board-column";

type Props = {
  projectId: string;
  columns: BoardColumnData[];
};

export function Board({ projectId, columns: serverColumns }: Props) {
  // Local copy of the board, so a drop can reorder cards instantly.
  const [columns, setColumns] = useState(serverColumns);

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

  // A stable id stops server and browser from generating different
  // accessibility ids (a hydration mismatch)
  const dndId = useId();

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    setColumns((current) =>
      current.map((column) => {
        const from = column.tasks.findIndex((task) => task.id === active.id);
        const to = column.tasks.findIndex((task) => task.id === over.id);
        // Both cards must be in this column. Moving between columns is step 4.2.
        if (from === -1 || to === -1) return column;
        return { ...column, tasks: arrayMove(column.tasks, from, to) };
      }),
    );
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 lg:grid lg:grid-cols-4">
        {columns.map((column) => (
          <BoardColumn key={column.status} projectId={projectId} {...column} />
        ))}
      </div>
    </DndContext>
  );
}
