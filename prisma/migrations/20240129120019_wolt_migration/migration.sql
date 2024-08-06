-- AlterTable
ALTER TABLE "business" ADD COLUMN     "address" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "open" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'Europe/Helsinki',
ALTER COLUMN "orderingBusinessId" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" SERIAL NOT NULL,
    "orderingBusinessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ipadFree" BOOLEAN
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL DEFAULT '0',
    "provider" TEXT NOT NULL,
    "orderingBusinessId" TEXT NOT NULL,
    "payMethodId" INTEGER,
    "status" TEXT NOT NULL,
    "deliveryType" INTEGER NOT NULL,
    "table" INTEGER,
    "preparedIn" TEXT,
    "createdAt" TEXT NOT NULL,
    "comment" TEXT,
    "type" TEXT NOT NULL,
    "deliveryEta" TEXT,
    "pickupEta" TEXT,
    "lastModified" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" SERIAL NOT NULL,
    "total" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preorder" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "preorderTime" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Preorder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreorderQueue" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "businessPublicId" TEXT NOT NULL,
    "processing" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TIMESTAMP(3) NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "provider" TEXT NOT NULL,

    CONSTRAINT "PreorderQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" TEXT NOT NULL,
    "comment" TEXT,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" SERIAL NOT NULL,
    "optionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "price" TEXT,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOption" (
    "id" SERIAL NOT NULL,
    "subOptionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "price" TEXT NOT NULL,
    "position" INTEGER,
    "quantity" INTEGER NOT NULL,
    "optionId" INTEGER NOT NULL,

    CONSTRAINT "SubOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "rate_type" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferSummary" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "discount" TEXT NOT NULL,

    CONSTRAINT "OfferSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_name_value_key" ON "ApiKey"("name", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_id_key" ON "Provider"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_orderingBusinessId_key" ON "Provider"("orderingBusinessId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_providerId_key" ON "Provider"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_orderId_key" ON "Summary"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_orderId_key" ON "Customer"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Preorder_orderId_key" ON "Preorder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PreorderQueue_providerOrderId_key" ON "PreorderQueue"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_id_key" ON "Offer"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_orderId_key" ON "Offer"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferSummary_id_key" ON "OfferSummary"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OfferSummary_offerId_key" ON "OfferSummary"("offerId");

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_orderingBusinessId_fkey" FOREIGN KEY ("orderingBusinessId") REFERENCES "business"("orderingBusinessId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_orderingBusinessId_fkey" FOREIGN KEY ("orderingBusinessId") REFERENCES "business"("orderingBusinessId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOption" ADD CONSTRAINT "SubOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferSummary" ADD CONSTRAINT "OfferSummary_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
