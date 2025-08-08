/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Record` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Record" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
