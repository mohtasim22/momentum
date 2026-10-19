-- AlterTable
ALTER TABLE "task" ADD COLUMN     "assigneeId" TEXT;

-- CreateIndex
CREATE INDEX "task_assigneeId_idx" ON "task"("assigneeId");

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
