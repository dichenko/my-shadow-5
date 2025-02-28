import prisma from '../../lib/prisma';
import { checkAdminAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Обработка GET запроса - доступно без аутентификации
  if (req.method === 'GET') {
    try {
      const { blockId, userId, includeAll } = req.query;
      
      // Если не указан blockId, возвращаем все вопросы
      if (!blockId) {
        const questions = await prisma.question.findMany({
          orderBy: [
            { order: 'asc' },
            { id: 'asc' }
          ],
          include: {
            block: true,
            practice: true
          }
        });
        
        return res.status(200).json(questions);
      }
      
      // Если указан blockId, фильтруем вопросы по блоку
      let where = { blockId: parseInt(blockId) };
      
      // Если указан userId и не указан includeAll, исключаем вопросы, на которые пользователь уже ответил
      if (userId && includeAll !== 'true') {
        // Находим пользователя
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
          // Получаем ID вопросов, на которые пользователь уже ответил
          const answeredQuestions = await prisma.answer.findMany({
            where: {
              userId: user.id
            },
            select: {
              questionId: true
            }
          });
          
          const answeredQuestionIds = answeredQuestions.map(a => a.questionId);
          
          // Исключаем вопросы, на которые пользователь уже ответил
          where = {
            ...where,
            id: {
              notIn: answeredQuestionIds
            }
          };
        }
      }
      
      const questions = await prisma.question.findMany({
        where,
        orderBy: [
          { order: 'asc' },
          { id: 'asc' }
        ],
        include: {
          block: true,
          practice: true
        }
      });
      
      return res.status(200).json(questions);
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
      // Проверяем существование блока и практики
      const block = await prisma.block.findUnique({
        where: { id: parseInt(blockId) },
      });
      
      if (!block) {
        return res.status(400).json({ error: 'Блок не найден' });
      }
      
      const practice = await prisma.practice.findUnique({
        where: { id: parseInt(practiceId) },
      });
      
      if (!practice) {
        return res.status(400).json({ error: 'Практика не найдена' });
      }
      
      // Получаем максимальный порядок для вопросов в этом блоке
      const maxOrderQuestion = await prisma.question.findFirst({
        where: { blockId: parseInt(blockId) },
        orderBy: { order: 'desc' },
      });
      
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
      // Если указаны blockId или practiceId, проверяем их существование
      if (blockId) {
        const block = await prisma.block.findUnique({
          where: { id: parseInt(blockId) },
        });
        
        if (!block) {
          return res.status(400).json({ error: 'Блок не найден' });
        }
      }
      
      if (practiceId) {
        const practice = await prisma.practice.findUnique({
          where: { id: parseInt(practiceId) },
        });
        
        if (!practice) {
          return res.status(400).json({ error: 'Практика не найдена' });
        }
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
      // Проверяем, есть ли ответы на этот вопрос
      const answersCount = await prisma.answer.count({
        where: { questionId: parseInt(id) },
      });
      
      if (answersCount > 0) {
        return res.status(400).json({ 
          error: 'Невозможно удалить вопрос, так как на него есть ответы. Удалите сначала все ответы.' 
        });
      }
      
      // Получаем информацию о вопросе перед удалением
      const question = await prisma.question.findUnique({
        where: { id: parseInt(id) },
      });
      
      if (!question) {
        return res.status(404).json({ error: 'Вопрос не найден' });
      }
      
      // Удаляем вопрос
      await prisma.question.delete({
        where: { id: parseInt(id) },
      });
      
      // Перенумеруем оставшиеся вопросы в этом блоке
      const remainingQuestions = await prisma.question.findMany({
        where: { blockId: question.blockId },
        orderBy: { order: 'asc' },
      });
      
      for (let i = 0; i < remainingQuestions.length; i++) {
        await prisma.question.update({
          where: { id: remainingQuestions[i].id },
          data: { order: i + 1 },
        });
      }
      
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