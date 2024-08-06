/*
  Warnings:

  - You are about to drop the column `provider_name` on the `credential` table. All the data in the column will be lost.
  - Added the required column `providerName` to the `credential` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "credential" DROP COLUMN "provider_name",
ADD COLUMN     "providerName" TEXT NOT NULL;
