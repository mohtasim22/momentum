"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateProjectForm } from "./create-project-form";

export function CreateProjectDialog() {
  // Controlled: we decide when it closes (after a successful create)
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        New project
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>You&apos;ll be its owner. You can invite your team afterwards.</DialogDescription>
        </DialogHeader>
        <CreateProjectForm onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
