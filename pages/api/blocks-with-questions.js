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
        
        return {
          ...block,
          questions,
          questionsCount: questions.length
        };
      })
    );

    return res.status(200).json(blocksWithQuestions);
  } catch (error) {
    console.error('Ошибка при получении блоков с вопросами:', error);
    return res.status(500).json({ error: 'Не удалось получить блоки с вопросами' });
  }
} 