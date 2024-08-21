-- CreateTable
CREATE TABLE "MenuTracking" (
    "id" SERIAL NOT NULL,
    "businessPublicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP NOT NULL,
    "synchronizeTime" TIMESTAMP(3) NOT NULL,
    "processing" BOOLEAN NOT NULL DEFAULT false,
    "onCooldown" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MenuTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuTracking_businessPublicId_key" ON "MenuTracking"("businessPublicId");
