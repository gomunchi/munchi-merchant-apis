/*
  Warnings:

  - You are about to drop the column `orderingUserId` on the `ProviderCredential` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerCredentialsId]` on the table `business` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProviderCredential_orderingUserId_key";

-- AlterTable
ALTER TABLE "ProviderCredential" DROP COLUMN "orderingUserId";

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "providerCredentialsId" INTEGER;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "providerCredentialsId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "business_providerCredentialsId_key" ON "business"("providerCredentialsId");

-- AddForeignKey
ALTER TABLE "business" ADD CONSTRAINT "business_providerCredentialsId_fkey" FOREIGN KEY ("providerCredentialsId") REFERENCES "ProviderCredential"("id") ON DELETE CASCADE ON UPDATE CASCADE;
