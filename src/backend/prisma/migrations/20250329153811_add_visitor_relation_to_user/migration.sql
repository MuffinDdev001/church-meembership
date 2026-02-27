-- AlterTable
ALTER TABLE "users" ADD COLUMN     "member_only_own_data" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visitor_id" INTEGER,
ADD COLUMN     "visitor_only_own_data" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
