-- CreateTable
CREATE TABLE "DonationType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "DonationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DonationToDonationType" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DonationToDonationType_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationType_name_key" ON "DonationType"("name");

-- CreateIndex
CREATE INDEX "_DonationToDonationType_B_index" ON "_DonationToDonationType"("B");

-- AddForeignKey
ALTER TABLE "_DonationToDonationType" ADD CONSTRAINT "_DonationToDonationType_A_fkey" FOREIGN KEY ("A") REFERENCES "donations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DonationToDonationType" ADD CONSTRAINT "_DonationToDonationType_B_fkey" FOREIGN KEY ("B") REFERENCES "DonationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
