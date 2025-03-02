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
        where: { id: parseInt(id) },
        include: {
          questions: {
            orderBy: [
              { order: 'asc' },
              { id: 'asc' }
            ],
            include: {
              practice: true
            }
          }
        }
      });
      
      if (!block) {
        return res.status(404).json({ error: 'Блок не найден' });
      }
      
      return res.status(200).json(block);
    }
    
    // Получаем все блоки с вопросами в одном запросе
    const blocks = await prisma.block.findMany({
      orderBy: [
        { order: 'asc' },
        { id: 'asc' }
      ],
      include: {
        questions: {
          orderBy: [
            { order: 'asc' },
            { id: 'asc' }
          ],
          include: {
            practice: true
          }
        }
      }
    });

    // Если передан userId, получаем все ответы пользователя в одном запросе
    let userAnswers = [];
    let userId_int = null;
    
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
        userId_int = user.id;
        
        // Получаем все ответы пользователя в одном запросе
        userAnswers = await prisma.answer.findMany({
          where: {
            userId: user.id
          },
          select: {
            questionId: true
          }
        });
      }
    }
    
    // Преобразуем ответы в Set для быстрого поиска
    const answeredQuestionIds = new Set(userAnswers.map(a => a.questionId));
    
    // Формируем результат с подсчетом отвеченных вопросов
    const blocksWithQuestions = blocks.map(block => {
      const questions = block.questions;
      
      // Если есть userId, подсчитываем количество отвеченных вопросов
      let answeredCount = 0;
      if (userId_int) {
        answeredCount = questions.filter(q => answeredQuestionIds.has(q.id)).length;
      }
      
      return {
        ...block,
        questions,
        questionsCount: questions.length,
        answeredCount
      };
    });

    return res.status(200).json(blocksWithQuestions);
  } catch (error) {
    console.error('Ошибка при получении блоков с вопросами:', error);
    return res.status(500).json({ error: 'Не удалось получить блоки с вопросами' });
  }
} 