-- AlterTable
ALTER TABLE "user_levels" ADD COLUMN     "canAddBank" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddCharges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddDeposit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddDonation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddExpense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddMember" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddReports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddVendor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canAddVisitor" BOOLEAN NOT NULL DEFAULT false;
