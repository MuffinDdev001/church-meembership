-- AlterTable
ALTER TABLE "Charge" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "markedForPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT;
