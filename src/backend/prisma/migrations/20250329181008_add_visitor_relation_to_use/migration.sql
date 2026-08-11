-- AlterTable
ALTER TABLE "user_levels" ADD COLUMN     "canAddChecks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_checks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "checks_access" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_add_checks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cannot_delete_checks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "checks_access" BOOLEAN NOT NULL DEFAULT false;
