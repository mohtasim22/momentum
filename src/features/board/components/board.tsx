"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { moveTask } from "@/features/tasks/actions";
import { boardAnnouncements, screenReaderInstructions } from "../board-announcements";
import { findColumn, moveToColumn, reorderWithinColumn, sameSpot, spotOf } from "../board-state";
import { MembersProvider } from "../members-context";
import type { BoardColumnData, BoardMember } from "../types";
import { BoardColumn } from "./board-column";
import { TaskCard } from "./task-card";

type Props = {
  projectId: string;
  columns: BoardColumnData[];
  members: BoardMember[];
};

export function Board({ projectId, columns: serverColumns, members }: Props) {
  const router = useRouter();

  // Local copy of the board, so a drop can reorder cards instantly.
  const [columns, setColumns] = useState(serverColumns);
  // The board as it was when the drag began, to restore if it's cancelled
  const [beforeDrag, setBeforeDrag] = useState<BoardColumnData[] | null>(null);
  // The card being dragged, shown floating under the pointer (DragOverlay)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Screen reader messages for the drag, built from the current board
  const announcements = boardAnnouncements(columns);

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
    // Keyboard: Space on a card's grip handle, then arrow keys
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [isSaving, startTransition] = useTransition();

  // A stable id stops server and browser from generating different
  // accessibility ids (a hydration mismatch)
  const dndId = useId();

  function handleDragStart({ active }: DragStartEvent) {
    setBeforeDrag(columns);
    setActiveId(active.id);
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
    setActiveId(null);
    if (!over || !snapshot) return;

    // 1. Optimistic: show the move straight away
    const next = reorderWithinColumn(columns, active.id, over.id);
    setColumns(next);

    const spot = spotOf(next, active.id);
    // Dropped exactly where it started: nothing to save
    if (!spot || sameSpot(spotOf(snapshot, active.id), spot)) return;

    // 2. Save in the background
    startTransition(async () => {
      let error: string | undefined;
      try {
        ({ error } = await moveTask(projectId, { taskId: String(active.id), ...spot }));
      } catch {
        // The request itself failed: offline, server down, timeout
        error = "Couldn't save that move. Check your connection and try again.";
      }
      if (!error) return;

      // 3. Rollback: put the board back, say why, and fetch the server's
      //    current board, since the reason is often that someone else
      //    changed it
      setColumns(snapshot);
      toast.error(error);
      router.refresh();
    });
  }

  // Escape pressed, or dropped somewhere invalid: put everything back
  function handleDragCancel() {
    if (beforeDrag) setColumns(beforeDrag);
    setBeforeDrag(null);
    setActiveId(null);
  }

  const activeTask =
    activeId === null
      ? null
      : columns.flatMap((column) => column.tasks).find((task) => task.id === activeId);

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{ announcements, screenReaderInstructions }}
    >
      <p
        aria-live="polite"
        className="mb-2 h-4 font-mono text-[11px] tracking-widest text-muted-foreground uppercase"
      >
        {isSaving ? "Saving…" : ""}
      </p>
      <MembersProvider value={members}>
        <div className="flex gap-3 lg:grid lg:grid-cols-4">
          {columns.map((column) => (
            <BoardColumn key={column.status} projectId={projectId} {...column} />
          ))}
        </div>
      </MembersProvider>
      {/* A floating copy of the card follows the pointer; the original stays
          in the list, faded, to show where it will land */}
      <DragOverlay>
        {activeTask && (
          <div className="shadow-xl shadow-black/40">
            <TaskCard
              title={activeTask.title}
              priority={activeTask.priority}
              dueDate={activeTask.dueDate}
              assigneeName={activeTask.assignee?.name}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
