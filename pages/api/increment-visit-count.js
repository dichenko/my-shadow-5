import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Получаем существующего пользователя по ID из Prisma
    const user = await prisma.telegramUser.findFirst({
      where: {
        OR: [
          { id: parseInt(userId) },
          { tgId: parseInt(userId) }
        ]
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Увеличиваем счетчик посещений
    const newVisitCount = (user.visitCount || 0) + 1;
    
    // Обновляем данные пользователя в базе данных
    const updatedUser = await prisma.telegramUser.update({
      where: { id: user.id },
      data: {
        visitCount: newVisitCount,
        lastVisit: new Date()
      }
    });
    
    return res.status(200).json({ 
      success: true,
      userId,
      visitCount: newVisitCount
    });
    
  } catch (error) {
    console.error('Error incrementing visit count:', error);
    return res.status(500).json({ error: 'Failed to increment visit count' });
  }
} 