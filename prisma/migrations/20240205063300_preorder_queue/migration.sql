/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `PreorderQueue` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PreorderQueue_orderId_key" ON "PreorderQueue"("orderId");
