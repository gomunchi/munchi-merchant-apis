/*
  Warnings:

  - You are about to drop the column `orderingBusinessId` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `providerCredentialsId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `ProviderCredential` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_orderingBusinessId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_providerCredentialsId_fkey";

-- DropIndex
DROP INDEX "Provider_id_key";

-- DropIndex
DROP INDEX "Provider_orderingBusinessId_key";

-- DropIndex
DROP INDEX "Provider_providerId_key";

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "orderingBusinessId",
DROP COLUMN "providerId",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Provider_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Provider_id_seq";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "providerCredentialsId";

-- DropTable
DROP TABLE "ProviderCredential";

-- CreateTable
CREATE TABLE "BusinessProviders" (
    "orderingBusinessId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "BusinessProviders_pkey" PRIMARY KEY ("orderingBusinessId","providerId")
);

-- CreateTable
CREATE TABLE "credential" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CredentialToProvider" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CredentialToProvider_AB_unique" ON "_CredentialToProvider"("A", "B");

-- CreateIndex
CREATE INDEX "_CredentialToProvider_B_index" ON "_CredentialToProvider"("B");

-- AddForeignKey
ALTER TABLE "BusinessProviders" ADD CONSTRAINT "BusinessProviders_orderingBusinessId_fkey" FOREIGN KEY ("orderingBusinessId") REFERENCES "business"("orderingBusinessId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessProviders" ADD CONSTRAINT "BusinessProviders_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CredentialToProvider" ADD CONSTRAINT "_CredentialToProvider_A_fkey" FOREIGN KEY ("A") REFERENCES "credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CredentialToProvider" ADD CONSTRAINT "_CredentialToProvider_B_fkey" FOREIGN KEY ("B") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
