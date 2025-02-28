import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  // Обрабатываем только DELETE запросы
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { userId, blockId } = req.query;
    
    if (!userId || !blockId) {
      return res.status(400).json({ error: 'Необходимо указать userId и blockId' });
    }
    
    // Находим пользователя по id или tgId
    let user = await prisma.telegramUser.findUnique({
      where: { id: parseInt(userId) }
    });
    
    // Если пользователь не найден по id, пытаемся найти по tgId
    if (!user) {
      user = await prisma.telegramUser.findUnique({
        where: { tgId: parseInt(userId) }
      });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Получаем все вопросы блока
    const questions = await prisma.question.findMany({
      where: {
        blockId: parseInt(blockId)
      },
      select: {
        id: true
      }
    });
    
    if (questions.length === 0) {
      return res.status(404).json({ error: 'Вопросы блока не найдены' });
    }
    
    // Получаем ID всех вопросов блока
    const questionIds = questions.map(q => q.id);
    
    // Удаляем ответы пользователя на вопросы этого блока
    const deleteResult = await prisma.answer.deleteMany({
      where: {
        userId: user.id,
        questionId: {
          in: questionIds
        }
      }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: `Удалено ${deleteResult.count} ответов пользователя на вопросы блока` 
    });
  } catch (error) {
    console.error('Ошибка при удалении ответов пользователя на блок:', error);
    return res.status(500).json({ error: 'Не удалось удалить ответы пользователя на блок' });
  }
} 