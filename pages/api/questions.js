import prisma from '../../lib/prisma';
import { checkAdminAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Обработка GET запроса - доступно без аутентификации
  if (req.method === 'GET') {
    try {
      const { blockId, userId, includeAll, page = '1', limit = '50' } = req.query;
      
      // Преобразуем параметры пагинации в числа
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      
      // Если не указан blockId, возвращаем все вопросы с пагинацией
      if (!blockId) {
        const [questions, total] = await Promise.all([
          prisma.question.findMany({
            orderBy: [
              { order: 'asc' },
              { id: 'asc' }
            ],
            include: {
              block: true,
              practice: true
            },
            skip,
            take: limitNum
          }),
          prisma.question.count()
        ]);
        
        return res.status(200).json({
          questions,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          }
        });
      }
      
      // Если указан blockId, фильтруем вопросы по блоку
      let where = { blockId: parseInt(blockId) };
      
      // Если указан userId и не указан includeAll, исключаем вопросы, на которые пользователь уже ответил
      if (userId && includeAll !== 'true') {
        // Находим пользователя и его ответы в одном запросе
        let user = null;
        let answeredQuestionIds = [];
        
        // Пытаемся найти пользователя по id
        user = await prisma.telegramUser.findUnique({
          where: { id: parseInt(userId) }
        });
        
        // Если пользователь не найден по id, пытаемся найти по tgId
        if (!user) {
          user = await prisma.telegramUser.findUnique({
            where: { tgId: parseInt(userId) }
          });
        }
        
        if (user) {
          // Получаем ID вопросов, на которые пользователь уже ответил, в одном запросе
          const answers = await prisma.answer.findMany({
            where: {
              userId: user.id
            },
            select: {
              questionId: true
            }
          });
          
          answeredQuestionIds = answers.map(a => a.questionId);
          
          // Исключаем вопросы, на которые пользователь уже ответил
          if (answeredQuestionIds.length > 0) {
            where = {
              ...where,
              id: {
                notIn: answeredQuestionIds
              }
            };
          }
        }
      }
      
      // Получаем вопросы и общее количество в одном запросе
      const [questions, total] = await Promise.all([
        prisma.question.findMany({
          where,
          orderBy: [
            { order: 'asc' },
            { id: 'asc' }
          ],
          include: {
            block: true,
            practice: true
          },
          skip,
          take: limitNum
        }),
        prisma.question.count({ where })
      ]);
      
      return res.status(200).json({
        questions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Ошибка при получении вопросов:', error);
      return res.status(500).json({ error: 'Не удалось получить вопросы' });
    }
  }
  
  // Для всех остальных методов требуется аутентификация
  const isAuthenticated = await checkAdminAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Обработка POST запроса
  if (req.method === 'POST') {
    const { text, blockId, practiceId, role } = req.body;
    
    // Проверка наличия обязательных полей
    if (!text || !blockId || !practiceId) {
      return res.status(400).json({ error: 'Необходимо указать text, blockId и practiceId' });
    }
    
    try {
      // Проверяем существование блока и практики в одном запросе
      const [block, practice, maxOrderQuestion] = await Promise.all([
        prisma.block.findUnique({
          where: { id: parseInt(blockId) },
        }),
        prisma.practice.findUnique({
          where: { id: parseInt(practiceId) },
        }),
        prisma.question.findFirst({
          where: { blockId: parseInt(blockId) },
          orderBy: { order: 'desc' },
        })
      ]);
      
      if (!block) {
        return res.status(400).json({ error: 'Блок не найден' });
      }
      
      if (!practice) {
        return res.status(400).json({ error: 'Практика не найдена' });
      }
      
      const newOrder = maxOrderQuestion ? maxOrderQuestion.order + 1 : 1;
      
      // Создаем новый вопрос
      const question = await prisma.question.create({
        data: {
          text,
          blockId: parseInt(blockId),
          practiceId: parseInt(practiceId),
          order: newOrder,
          role: role || 'none',
        },
      });
      
      return res.status(201).json(question);
    } catch (error) {
      console.error('Ошибка при создании вопроса:', error);
      return res.status(500).json({ error: 'Не удалось создать вопрос' });
    }
  }
  
  // Обработка PUT запроса
  if (req.method === 'PUT') {
    const { id, text, blockId, practiceId, order, role } = req.body;
    
    // Проверка наличия обязательных полей
    if (!id || !text) {
      return res.status(400).json({ error: 'Необходимо указать id и text' });
    }
    
    try {
      // Если указаны blockId или practiceId, проверяем их существование в одном запросе
      const checkPromises = [];
      
      if (blockId) {
        checkPromises.push(
          prisma.block.findUnique({
            where: { id: parseInt(blockId) },
          })
        );
      }
      
      if (practiceId) {
        checkPromises.push(
          prisma.practice.findUnique({
            where: { id: parseInt(practiceId) },
          })
        );
      }
      
      const checkResults = await Promise.all(checkPromises);
      
      if (blockId && !checkResults[0]) {
        return res.status(400).json({ error: 'Блок не найден' });
      }
      
      if (practiceId && !checkResults[blockId ? 1 : 0]) {
        return res.status(400).json({ error: 'Практика не найдена' });
      }
      
      // Обновляем вопрос
      const question = await prisma.question.update({
        where: { id: parseInt(id) },
        data: {
          text,
          blockId: blockId ? parseInt(blockId) : undefined,
          practiceId: practiceId ? parseInt(practiceId) : undefined,
          order: order ? parseInt(order) : undefined,
          role: role || undefined,
        },
      });
      
      return res.status(200).json(question);
    } catch (error) {
      console.error('Ошибка при обновлении вопроса:', error);
      return res.status(500).json({ error: 'Не удалось обновить вопрос' });
    }
  }
  
  // Обработка DELETE запроса
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Необходимо указать id' });
    }
    
    try {
      // Получаем информацию о вопросе и проверяем наличие ответов в одном запросе
      const [question, answersCount] = await Promise.all([
        prisma.question.findUnique({
          where: { id: parseInt(id) },
        }),
        prisma.answer.count({
          where: { questionId: parseInt(id) },
        })
      ]);
      
      if (!question) {
        return res.status(404).json({ error: 'Вопрос не найден' });
      }
      
      if (answersCount > 0) {
        return res.status(400).json({ 
          error: 'Невозможно удалить вопрос, так как на него есть ответы. Удалите сначала все ответы.' 
        });
      }
      
      // Удаляем вопрос
      await prisma.question.delete({
        where: { id: parseInt(id) },
      });
      
      // Получаем оставшиеся вопросы в этом блоке
      const remainingQuestions = await prisma.question.findMany({
        where: { blockId: question.blockId },
        orderBy: { order: 'asc' },
      });
      
      // Обновляем порядок оставшихся вопросов в одной транзакции
      await prisma.$transaction(
        remainingQuestions.map((q, index) => 
          prisma.question.update({
            where: { id: q.id },
            data: { order: index + 1 },
          })
        )
      );
      
      return res.status(200).json({ success: true, message: 'Вопрос успешно удален' });
    } catch (error) {
      console.error('Ошибка при удалении вопроса:', error);
      return res.status(500).json({ error: 'Не удалось удалить вопрос' });
    }
  }
  
  // Если метод не поддерживается
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 