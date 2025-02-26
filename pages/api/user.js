import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const userData = req.body
    console.log('Получены данные пользователя:', userData)

    if (!userData || !userData.id) {
      console.error('Ошибка: отсутствует ID пользователя в данных')
      return res.status(400).json({ error: 'Missing user ID' })
    }

    // Проверяем, существует ли таблица TelegramUser
    try {
      await prisma.$queryRaw`SELECT 1 FROM "TelegramUser" LIMIT 1`
      console.log('Таблица TelegramUser существует')
    } catch (tableError) {
      console.error('Ошибка при проверке таблицы:', tableError)
      
      // Создаем таблицу, если она не существует
      try {
        console.log('Создаем таблицу TelegramUser...')
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
        `
        await prisma.$executeRaw`
          CREATE UNIQUE INDEX IF NOT EXISTS "TelegramUser_tgId_key" ON "TelegramUser"("tgId");
        `
        console.log('Таблица TelegramUser успешно создана')
      } catch (createError) {
        console.error('Ошибка при создании таблицы:', createError)
        return res.status(500).json({ error: 'Failed to create table' })
      }
    }

    // Сохраняем данные пользователя
    console.log('Сохраняем данные пользователя с ID:', userData.id)
    const user = await prisma.telegramUser.upsert({
      where: {
        tgId: userData.id
      },
      update: {
        lastVisit: new Date(),
        visitCount: {
          increment: 1
        }
      },
      create: {
        tgId: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        languageCode: userData.language_code,
      }
    })

    console.log('Пользователь успешно сохранен:', user)
    res.status(200).json(user)
  } catch (error) {
    console.error('Ошибка при сохранении пользователя:', error)
    res.status(500).json({ error: 'Failed to save user data', details: error.message })
  }
} 