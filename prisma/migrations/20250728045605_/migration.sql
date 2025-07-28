/*
  Warnings:

  - A unique constraint covering the columns `[lastOpenedTableId]` on the table `Base` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lastOpenedViewId]` on the table `Table` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Base" ADD COLUMN     "lastOpenedTableId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Base_lastOpenedTableId_key" ON "Base"("lastOpenedTableId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_lastOpenedViewId_key" ON "Table"("lastOpenedViewId");

-- AddForeignKey
ALTER TABLE "Base" ADD CONSTRAINT "Base_lastOpenedTableId_fkey" FOREIGN KEY ("lastOpenedTableId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_lastOpenedViewId_fkey" FOREIGN KEY ("lastOpenedViewId") REFERENCES "View"("id") ON DELETE SET NULL ON UPDATE CASCADE;
