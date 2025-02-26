const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Проверяем, существует ли таблица TelegramUser
    await prisma.$queryRaw`SELECT 1 FROM "TelegramUser" LIMIT 1`;
    console.log('Таблица TelegramUser уже существует');
  } catch (error) {
    console.log('Таблица TelegramUser не существует, создаем...');
    
    // Создаем таблицу TelegramUser
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TelegramUser" (
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
    `;
    
    // Создаем уникальный индекс
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "TelegramUser_tgId_key" ON "TelegramUser"("tgId");
    `;
    
    console.log('Таблица TelegramUser успешно создана');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 