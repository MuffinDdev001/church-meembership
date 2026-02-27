-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_member_id_fkey";

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "visitor_id" INTEGER,
ALTER COLUMN "member_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
