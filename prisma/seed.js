const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Запуск скрипта инициализации базы данных...');
  
  try {
    // Проверяем подключение к базе данных
    console.log('Проверка подключения к базе данных...');
    await prisma.$executeRaw`SELECT 1`;
    console.log('Подключение к базе данных успешно установлено');
    
    // Проверяем, существует ли таблица TelegramUser
    try {
      console.log('Проверка существования таблицы TelegramUser...');
      await prisma.$executeRaw`SELECT 1 FROM "TelegramUser" LIMIT 1`;
      console.log('Таблица TelegramUser уже существует');
    } catch (error) {
      console.log('Таблица TelegramUser не существует, создаем...');
      
      // Создаем таблицу TelegramUser
      try {
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
      } catch (createError) {
        console.error('Ошибка при создании таблицы:', createError);
        throw createError;
      }
    }
    
    console.log('Инициализация базы данных успешно завершена');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  }
}

main()
  .then(async () => {
    console.log('Скрипт успешно выполнен');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Ошибка при выполнении скрипта:', e);
    await prisma.$disconnect();
    process.exit(1);
  }); 