/*
  Warnings:

  - You are about to drop the column `recordId` on the `Cell` table. All the data in the column will be lost.
  - You are about to drop the `Record` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[fieldId,rowNum]` on the table `Cell` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rowNum` to the `Cell` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Cell" DROP CONSTRAINT "Cell_recordId_fkey";

-- DropForeignKey
ALTER TABLE "Record" DROP CONSTRAINT "Record_tableId_fkey";

-- AlterTable
ALTER TABLE "Cell" DROP COLUMN "recordId",
ADD COLUMN     "rowNum" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Record";

-- CreateIndex
CREATE UNIQUE INDEX "Cell_fieldId_rowNum_key" ON "Cell"("fieldId", "rowNum");
