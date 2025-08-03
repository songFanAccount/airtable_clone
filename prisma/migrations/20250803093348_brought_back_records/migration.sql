/*
  Warnings:

  - You are about to drop the column `rowNum` on the `Cell` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[recordId,fieldId]` on the table `Cell` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `recordId` to the `Cell` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Cell_fieldId_rowNum_key";

-- AlterTable
ALTER TABLE "Cell" DROP COLUMN "rowNum",
ADD COLUMN     "recordId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "rowNum" INTEGER NOT NULL,
    "tableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Record_tableId_rowNum_key" ON "Record"("tableId", "rowNum");

-- CreateIndex
CREATE UNIQUE INDEX "Cell_recordId_fieldId_key" ON "Cell"("recordId", "fieldId");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
