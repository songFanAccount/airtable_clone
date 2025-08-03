-- CreateEnum
CREATE TYPE "FilterJoinType" AS ENUM ('AND', 'OR');

-- CreateEnum
CREATE TYPE "FilterOperator" AS ENUM ('GREATERTHAN', 'SMALLERTHAN', 'NOTEMPTY', 'EMPTY', 'CONTAINS', 'NOTCONTAINS', 'EQUALTO');

-- CreateEnum
CREATE TYPE "SortOperator" AS ENUM ('INCREASING', 'DECREASING');

-- AlterTable
ALTER TABLE "View" ADD COLUMN     "hiddenFieldIds" TEXT[];

-- CreateTable
CREATE TABLE "Filter" (
    "id" TEXT NOT NULL,
    "joinType" "FilterJoinType" NOT NULL,
    "viewId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "operator" "FilterOperator" NOT NULL,
    "compareVal" TEXT NOT NULL,

    CONSTRAINT "Filter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sort" (
    "id" TEXT NOT NULL,
    "viewId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "operator" "SortOperator" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sort_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Filter" ADD CONSTRAINT "Filter_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sort" ADD CONSTRAINT "Sort_viewId_fkey" FOREIGN KEY ("viewId") REFERENCES "View"("id") ON DELETE CASCADE ON UPDATE CASCADE;
