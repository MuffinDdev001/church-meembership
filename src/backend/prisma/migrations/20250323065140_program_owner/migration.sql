/*
  Warnings:

  - You are about to drop the column `user_level_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_user_level_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "user_level_id",
ADD COLUMN     "admin_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bank_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_bank" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_charges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_deposit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_donation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_expense" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_group" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_member" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_reports" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_vendor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "can_add_visitor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_bank" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_charges" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_deposit" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_donation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_expense" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_group" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_member" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_reports" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_vendor" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cannot_delete_visitor" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "charges_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deposit_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "donation_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expense_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "group_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "member_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reports_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendor_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visitor_access" BOOLEAN NOT NULL DEFAULT false;
