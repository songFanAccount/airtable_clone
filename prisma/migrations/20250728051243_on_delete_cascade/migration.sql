-- DropForeignKey
ALTER TABLE "Base" DROP CONSTRAINT "Base_userId_fkey";

-- DropForeignKey
ALTER TABLE "Field" DROP CONSTRAINT "Field_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Record" DROP CONSTRAINT "Record_tableId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_baseId_fkey";

-- DropForeignKey
ALTER TABLE "View" DROP CONSTRAINT "View_tableId_fkey";

-- AddForeignKey
ALTER TABLE "Base" ADD CONSTRAINT "Base_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "Base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
