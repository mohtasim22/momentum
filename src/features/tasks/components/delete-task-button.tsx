"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteTask } from "../actions";

type Props = {
  projectId: string;
  taskId: string;
  onDeleted?: () => void;
};

// Two clicks to delete: the first arms it, the second confirms.
// Calls the Server Action directly (no form), inside a transition.
export function DeleteTaskButton({ projectId, taskId, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteTask(projectId, taskId);
      if (result.error) {
        setError(result.error);
        setConfirming(false);
      } else {
        onDeleted?.();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={handleClick}
        onBlur={() => setConfirming(false)}
      >
        <Trash2 data-icon="inline-start" />
        {pending ? "Deleting…" : confirming ? "Click again to delete" : "Delete task"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
