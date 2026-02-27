-- AlterTable
ALTER TABLE "user_levels" ADD COLUMN     "bank_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "charges_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deposit_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expense_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reports_access" BOOLEAN NOT NULL DEFAULT false;
