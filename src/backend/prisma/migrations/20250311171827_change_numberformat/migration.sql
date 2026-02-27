-- AlterTable
ALTER TABLE "members" ALTER COLUMN "member_number" DROP DEFAULT,
ALTER COLUMN "member_number" SET DATA TYPE TEXT;
DROP SEQUENCE "members_member_number_seq";

-- AlterTable
ALTER TABLE "visitors" ALTER COLUMN "visitor_number" DROP DEFAULT,
ALTER COLUMN "visitor_number" SET DATA TYPE TEXT;
DROP SEQUENCE "visitors_visitor_number_seq";
