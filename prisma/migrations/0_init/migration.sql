-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "deviceId" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "lastAccessTs" TIMESTAMP(6) NOT NULL,
    "openAppNotifcationSending" BOOLEAN NOT NULL DEFAULT false,
    "openAppNotificationCount" INTEGER DEFAULT 0,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "orderingUserId" INTEGER NOT NULL,
    "orderingAccessToken" TEXT NOT NULL,
    "orderingAccessTokenExpiredAt" TIMESTAMP(6) NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "level" INTEGER,
    "publicId" TEXT NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business" (
    "id" SERIAL NOT NULL,
    "orderingBusinessId" INTEGER NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,

    CONSTRAINT "business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(6) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_status_queue" (
    "id" SERIAL NOT NULL,
    "userPublicId" TEXT NOT NULL,
    "businessPublicId" TEXT NOT NULL,
    "time" TIMESTAMP(6) NOT NULL,
    "provider" TEXT NOT NULL,
    "processing" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "active_status_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BusinessSessionTable" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_MyUserBusinessTable" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_publicId_key" ON "Session"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "Session_deviceId_key" ON "Session"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_orderingUserId_key" ON "user"("orderingUserId");

-- CreateIndex
CREATE UNIQUE INDEX "user_orderingAccessToken_key" ON "user"("orderingAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_publicId_key" ON "user"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "business_orderingBusinessId_key" ON "business"("orderingBusinessId");

-- CreateIndex
CREATE UNIQUE INDEX "business_publicId_key" ON "business"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "active_status_queue_userPublicId_key" ON "active_status_queue"("userPublicId");

-- CreateIndex
CREATE UNIQUE INDEX "active_status_queue_businessPublicId_key" ON "active_status_queue"("businessPublicId");

-- CreateIndex
CREATE INDEX "_BusinessSessionTable_B_index" ON "_BusinessSessionTable"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BusinessSessionTable_AB_unique" ON "_BusinessSessionTable"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_MyUserBusinessTable_AB_unique" ON "_MyUserBusinessTable"("A", "B");

-- CreateIndex
CREATE INDEX "_MyUserBusinessTable_B_index" ON "_MyUserBusinessTable"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessSessionTable" ADD CONSTRAINT "_BusinessSessionTable_A_fkey" FOREIGN KEY ("A") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusinessSessionTable" ADD CONSTRAINT "_BusinessSessionTable_B_fkey" FOREIGN KEY ("B") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MyUserBusinessTable" ADD CONSTRAINT "_MyUserBusinessTable_A_fkey" FOREIGN KEY ("A") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MyUserBusinessTable" ADD CONSTRAINT "_MyUserBusinessTable_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

