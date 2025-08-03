/*
  Warnings:

  - You are about to drop the column `lastAddedRecordPos` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the column `recordCount` on the `Table` table. All the data in the column will be lost.
  - You are about to drop the `Record` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Record" DROP CONSTRAINT "Record_tableId_fkey";

-- AlterTable
ALTER TABLE "Table" DROP COLUMN "lastAddedRecordPos",
DROP COLUMN "recordCount";

-- DropTable
DROP TABLE "Record";

-- CreateTable
CREATE TABLE "Cell" (
    "id" TEXT NOT NULL,
    "rowNum" INTEGER NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Cell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cell_fieldId_rowNum_key" ON "Cell"("fieldId", "rowNum");

-- AddForeignKey
ALTER TABLE "Cell" ADD CONSTRAINT "Cell_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
