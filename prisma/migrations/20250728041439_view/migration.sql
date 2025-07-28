-- CreateTable
CREATE TABLE "View" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,

    CONSTRAINT "View_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "View" ADD CONSTRAINT "View_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
