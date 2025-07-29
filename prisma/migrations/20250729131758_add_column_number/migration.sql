/*
  Warnings:

  - A unique constraint covering the columns `[tableId,columnNumber]` on the table `Field` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `columnNumber` to the `Field` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "columnNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Field_tableId_columnNumber_key" ON "Field"("tableId", "columnNumber");
