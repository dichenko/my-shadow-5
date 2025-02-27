import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  // Обрабатываем только DELETE запросы
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'Необходимо указать userId' });
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
    
    // Удаляем все ответы пользователя
    const deleteResult = await prisma.answer.deleteMany({
      where: {
        userId: user.id
      }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: `Удалено ${deleteResult.count} ответов пользователя` 
    });
  } catch (error) {
    console.error('Ошибка при удалении ответов пользователя:', error);
    return res.status(500).json({ error: 'Не удалось удалить ответы пользователя' });
  }
} 