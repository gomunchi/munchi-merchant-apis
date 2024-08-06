/*
  Warnings:

  - A unique constraint covering the columns `[providerCredentialsId]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerCredentialsId` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_orderingBusinessId_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "providerCredentialsId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ProviderCredential" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "apiKey" TEXT,
    "orderingUserId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCredential_id_key" ON "ProviderCredential"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCredential_orderingUserId_key" ON "ProviderCredential"("orderingUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_providerCredentialsId_key" ON "user"("providerCredentialsId");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_providerCredentialsId_fkey" FOREIGN KEY ("providerCredentialsId") REFERENCES "ProviderCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_orderingBusinessId_fkey" FOREIGN KEY ("orderingBusinessId") REFERENCES "business"("orderingBusinessId") ON DELETE CASCADE ON UPDATE CASCADE;
