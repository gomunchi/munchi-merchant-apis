/*
  Warnings:

  - You are about to drop the column `providerCredentialsId` on the `business` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "business" DROP CONSTRAINT "business_providerCredentialsId_fkey";

-- DropIndex
DROP INDEX "business_providerCredentialsId_key";

-- AlterTable
ALTER TABLE "business" DROP COLUMN "providerCredentialsId";
