/*
  Warnings:

  - The primary key for the `BusinessProviders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[providerId]` on the table `BusinessProviders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BusinessProviders" DROP CONSTRAINT "BusinessProviders_pkey",
ADD CONSTRAINT "BusinessProviders_pkey" PRIMARY KEY ("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessProviders_providerId_key" ON "BusinessProviders"("providerId");
