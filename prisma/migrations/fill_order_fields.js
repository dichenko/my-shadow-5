const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Функция для генерации случайного кода
function generatePairCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

// Функция для проверки существования кода
async function isPairCodeExists(code) {
  const user = await prisma.telegramUser.findUnique({
    where: { pairCode: code }
  });
  
  return !!user;
}

// Функция для генерации уникального кода
async function generateUniquePairCode() {
  let code = generatePairCode();
  let exists = await isPairCodeExists(code);
  
  // Если код уже существует, генерируем новый
  while (exists) {
    code = generatePairCode();
    exists = await isPairCodeExists(code);
  }
  
  return code;
}

async function fillOrderFields() {
  try {
    console.log('Начинаем заполнение полей order...');

    // Заполняем поле order для блоков
    const blocks = await prisma.block.findMany();
    console.log(`Найдено ${blocks.length} блоков`);

    for (const block of blocks) {
      try {
        await prisma.block.update({
          where: { id: block.id },
          data: { 
            order: block.id
          }
        });
        console.log(`Обновлен блок ${block.id}`);
      } catch (error) {
        console.error(`Ошибка при обновлении блока ${block.id}:`, error);
      }
    }

    // Заполняем поле order для вопросов
    const questions = await prisma.question.findMany();
    console.log(`Найдено ${questions.length} вопросов`);

    for (const question of questions) {
      try {
        await prisma.question.update({
          where: { id: question.id },
          data: { 
            order: question.id
          }
        });
        console.log(`Обновлен вопрос ${question.id}`);
      } catch (error) {
        console.error(`Ошибка при обновлении вопроса ${question.id}:`, error);
      }
    }

    // Генерируем уникальные коды для пользователей без пары
    const users = await prisma.telegramUser.findMany({
      where: {
        partnerId: null,
        pairCode: null
      }
    });
    console.log(`Найдено ${users.length} пользователей без пары и кода`);

    for (const user of users) {
      try {
        const pairCode = await generateUniquePairCode();
        await prisma.telegramUser.update({
          where: { id: user.id },
          data: { 
            pairCode
          }
        });
        console.log(`Сгенерирован код для пользователя ${user.id}: ${pairCode}`);
      } catch (error) {
        console.error(`Ошибка при генерации кода для пользователя ${user.id}:`, error);
      }
    }

    console.log('Заполнение полей order и генерация кодов успешно завершены');
  } catch (error) {
    console.error('Общая ошибка при выполнении миграции:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillOrderFields(); 