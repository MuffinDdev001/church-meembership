-- AlterTable
ALTER TABLE "user_levels" ADD COLUMN     "admin_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "donation_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "group_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "member_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendor_access" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visitor_access" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';
