-- AlterTable
ALTER TABLE "users" ADD COLUMN     "user_level_id" INTEGER;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_user_level_id_fkey" FOREIGN KEY ("user_level_id") REFERENCES "user_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
