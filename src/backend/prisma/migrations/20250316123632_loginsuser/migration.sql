-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_change_required" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_levels" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_levels_name_key" ON "user_levels"("name");
