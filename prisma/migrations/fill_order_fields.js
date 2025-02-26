const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

    console.log('Заполнение полей order успешно завершено');
  } catch (error) {
    console.error('Общая ошибка при заполнении полей order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillOrderFields(); 