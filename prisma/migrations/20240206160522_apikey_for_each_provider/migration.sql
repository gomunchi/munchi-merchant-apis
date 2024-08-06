/*
  Warnings:

  - Added the required column `apiKey` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "apiKey" TEXT NOT NULL;
