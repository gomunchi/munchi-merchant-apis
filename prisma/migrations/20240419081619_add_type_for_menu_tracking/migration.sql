/*
  Warnings:

  - Added the required column `type` to the `MenuTracking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MenuTracking" ADD COLUMN     "type" TEXT NOT NULL;
