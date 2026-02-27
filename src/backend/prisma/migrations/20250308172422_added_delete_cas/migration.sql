-- DropForeignKey
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_member_id_fkey";

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
