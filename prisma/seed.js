const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Запуск скрипта инициализации базы данных...');
  
  try {
    // Проверяем подключение к базе данных
    console.log('Проверка подключения к базе данных...');
    await prisma.$executeRaw`SELECT 1`;
    console.log('Подключение к базе данных успешно установлено');
    
    // Создаем таблицы, если они не существуют
    await createTelegramUserTable();
    await createPracticeTable();
    await createBlockTable();
    await createQuestionTable();
    await createAnswerTable();
    
    console.log('Инициализация базы данных успешно завершена');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  }
}

async function createTelegramUserTable() {
  try {
    // Проверяем, существует ли таблица TelegramUser
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
      console.error('Ошибка при создании таблицы TelegramUser:', createError);
      throw createError;
    }
  }
}

async function createPracticeTable() {
  try {
    // Проверяем, существует ли таблица Practice
    await prisma.$executeRaw`SELECT 1 FROM "Practice" LIMIT 1`;
    console.log('Таблица Practice уже существует');
  } catch (error) {
    console.log('Таблица Practice не существует, создаем...');
    
    // Создаем таблицу Practice
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Practice" (
          "id" SERIAL NOT NULL,
          "name" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Practice_pkey" PRIMARY KEY ("id")
        );
      `;
      
      console.log('Таблица Practice успешно создана');
    } catch (createError) {
      console.error('Ошибка при создании таблицы Practice:', createError);
      throw createError;
    }
  }
}

async function createBlockTable() {
  try {
    // Проверяем, существует ли таблица Block
    await prisma.$executeRaw`SELECT 1 FROM "Block" LIMIT 1`;
    console.log('Таблица Block уже существует');
  } catch (error) {
    console.log('Таблица Block не существует, создаем...');
    
    // Создаем таблицу Block
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Block" (
          "id" SERIAL NOT NULL,
          "name" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
        );
      `;
      
      console.log('Таблица Block успешно создана');
    } catch (createError) {
      console.error('Ошибка при создании таблицы Block:', createError);
      throw createError;
    }
  }
}

async function createQuestionTable() {
  try {
    // Проверяем, существует ли таблица Question
    await prisma.$executeRaw`SELECT 1 FROM "Question" LIMIT 1`;
    console.log('Таблица Question уже существует');
  } catch (error) {
    console.log('Таблица Question не существует, создаем...');
    
    // Создаем таблицу Question
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Question" (
          "id" SERIAL NOT NULL,
          "text" TEXT NOT NULL,
          "blockId" INTEGER NOT NULL,
          "practiceId" INTEGER NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'none',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Создаем внешние ключи
      await prisma.$executeRaw`
        ALTER TABLE "Question" ADD CONSTRAINT "Question_blockId_fkey" 
        FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE "Question" ADD CONSTRAINT "Question_practiceId_fkey" 
        FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
      
      console.log('Таблица Question успешно создана');
    } catch (createError) {
      console.error('Ошибка при создании таблицы Question:', createError);
      throw createError;
    }
  }
}

async function createAnswerTable() {
  try {
    // Проверяем, существует ли таблица Answer
    await prisma.$executeRaw`SELECT 1 FROM "Answer" LIMIT 1`;
    console.log('Таблица Answer уже существует');
  } catch (error) {
    console.log('Таблица Answer не существует, создаем...');
    
    // Создаем таблицу Answer
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Answer" (
          "id" SERIAL NOT NULL,
          "questionId" INTEGER NOT NULL,
          "userId" INTEGER NOT NULL,
          "text" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Создаем внешние ключи
      await prisma.$executeRaw`
        ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" 
        FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE "Answer" ADD CONSTRAINT "Answer_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `;
      
      console.log('Таблица Answer успешно создана');
    } catch (createError) {
      console.error('Ошибка при создании таблицы Answer:', createError);
      throw createError;
    }
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