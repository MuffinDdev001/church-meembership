/*
  Warnings:

  - You are about to drop the column `checkAmount` on the `Deposit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Deposit" DROP COLUMN "checkAmount";

-- CreateTable
CREATE TABLE "Check" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "depositId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Check_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "Deposit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
