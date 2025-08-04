/*
  Warnings:

  - A unique constraint covering the columns `[viewId,fieldId]` on the table `Sort` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Sort_viewId_fieldId_key" ON "Sort"("viewId", "fieldId");

-- AddForeignKey
ALTER TABLE "Sort" ADD CONSTRAINT "Sort_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
