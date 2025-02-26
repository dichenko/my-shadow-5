import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fillOrderFields() {
  try {
    console.log('Начинаем заполнение полей order...');

    // Заполняем поле order для блоков
    const blocks = await prisma.block.findMany();
    for (const block of blocks) {
      await prisma.block.update({
        where: { id: block.id },
        data: { order: block.id }
      });
    }
    console.log(`Обновлено ${blocks.length} блоков`);

    // Заполняем поле order для вопросов
    const questions = await prisma.question.findMany();
    for (const question of questions) {
      await prisma.question.update({
        where: { id: question.id },
        data: { order: question.id }
      });
    }
    console.log(`Обновлено ${questions.length} вопросов`);

    console.log('Заполнение полей order успешно завершено');
  } catch (error) {
    console.error('Ошибка при заполнении полей order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillOrderFields(); 