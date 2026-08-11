/*
  Warnings:

  - You are about to drop the column `home_church` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "home_church",
ADD COLUMN     "past_church" TEXT;
