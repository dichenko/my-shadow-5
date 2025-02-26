import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    // Получаем все блоки
    const blocks = await prisma.block.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Для каждого блока получаем количество вопросов
    const blocksWithQuestions = await Promise.all(
      blocks.map(async (block) => {
        const questionsCount = await prisma.question.count({
          where: { blockId: block.id },
        });

        return {
          ...block,
          questionsCount,
        };
      })
    );

    return res.status(200).json(blocksWithQuestions);
  } catch (error) {
    console.error('Ошибка при получении блоков с вопросами:', error);
    return res.status(500).json({ error: 'Не удалось получить блоки с вопросами', details: error.message });
  }
} 