-- AlterTable
ALTER TABLE "user_levels" ALTER COLUMN "cannot_delete_bank" SET DEFAULT true,
ALTER COLUMN "cannot_delete_charges" SET DEFAULT true,
ALTER COLUMN "cannot_delete_deposit" SET DEFAULT true,
ALTER COLUMN "cannot_delete_donation" SET DEFAULT true,
ALTER COLUMN "cannot_delete_expense" SET DEFAULT true,
ALTER COLUMN "cannot_delete_group" SET DEFAULT true,
ALTER COLUMN "cannot_delete_member" SET DEFAULT true,
ALTER COLUMN "cannot_delete_reports" SET DEFAULT true,
ALTER COLUMN "cannot_delete_vendor" SET DEFAULT true,
ALTER COLUMN "cannot_delete_visitor" SET DEFAULT true;
