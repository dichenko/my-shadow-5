import prisma from '../../lib/prisma';
import { checkAdminAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Обрабатываем только GET запросы
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;
    const userId = req.query.userId; // Получаем userId из запроса
    
    // Если указан id, возвращаем конкретный блок с вопросами (доступно без аутентификации)
    if (id) {
      const block = await prisma.block.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (!block) {
        return res.status(404).json({ error: 'Блок не найден' });
      }
      
      // Получаем вопросы для этого блока
      const questions = await prisma.question.findMany({
        where: { blockId: parseInt(id) },
        orderBy: [
          { order: 'asc' },
          { id: 'asc' }
        ],
        include: {
          practice: true
        }
      });
      
      return res.status(200).json({
        ...block,
        questions
      });
    }
    
    // Получаем все блоки (доступно без аутентификации)
    const blocks = await prisma.block.findMany({
      orderBy: [
        { order: 'asc' },
        { id: 'asc' }
      ]
    });

    // Для каждого блока получаем вопросы и считаем их количество
    const blocksWithQuestions = await Promise.all(
      blocks.map(async (block) => {
        const questions = await prisma.question.findMany({
          where: { blockId: block.id },
          orderBy: [
            { order: 'asc' },
            { id: 'asc' }
          ],
          include: {
            practice: true
          }
        });
        
        let answeredCount = 0;
        
        // Если передан userId, получаем количество отвеченных вопросов
        if (userId) {
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
          
          if (user) {
            // Получаем ответы пользователя на вопросы этого блока
            const answers = await prisma.answer.findMany({
              where: {
                userId: user.id,
                question: {
                  blockId: block.id
                }
              }
            });
            
            answeredCount = answers.length;
          }
        }
        
        return {
          ...block,
          questions,
          questionsCount: questions.length,
          answeredCount: answeredCount
        };
      })
    );

    return res.status(200).json(blocksWithQuestions);
  } catch (error) {
    console.error('Ошибка при получении блоков с вопросами:', error);
    return res.status(500).json({ error: 'Не удалось получить блоки с вопросами' });
  }
} 