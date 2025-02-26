-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" SERIAL NOT NULL,
    "tgId" INTEGER NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "languageCode" TEXT,
    "firstVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_tgId_key" ON "TelegramUser"("tgId"); 