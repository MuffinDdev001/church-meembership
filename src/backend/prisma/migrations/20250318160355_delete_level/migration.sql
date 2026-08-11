-- AlterTable
ALTER TABLE "user_levels" ADD COLUMN     "cannot_delete_bank" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_charges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_deposit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_donation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_expense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_group" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_member" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_reports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_vendor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_visitor" BOOLEAN NOT NULL DEFAULT false;
