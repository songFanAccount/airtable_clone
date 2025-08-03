/*
  Warnings:

  - You are about to drop the column `rowNum` on the `Cell` table. All the data in the column will be lost.
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
    "tableId" TEXT NOT NULL,
    "rowNum" INTEGER NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
