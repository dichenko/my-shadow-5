import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getAnswers(req, res);
    case 'POST':
      return createAnswer(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Получение списка ответов
async function getAnswers(req, res) {
  try {
    const { questionId, userId } = req.query;
    
    // Формируем условия фильтрации
    const where = {};
    
    if (questionId) {
      where.questionId = parseInt(questionId);
    }
    
    if (userId) {
      where.userId = parseInt(userId);
    }
    
    const answers = await prisma.answer.findMany({
      where,
      include: {
        question: true,
        user: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
    
    return res.status(200).json(answers);
  } catch (error) {
    console.error('Ошибка при получении списка ответов:', error);
    return res.status(500).json({ error: 'Failed to fetch answers', details: error.message });
  }
}

// Создание нового ответа
async function createAnswer(req, res) {
  try {
    const { questionId, userId, text } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required' });
    }
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!text) {
      return res.status(400).json({ error: 'Answer text is required' });
    }
    
    // Проверяем существование вопроса и пользователя
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    const user = await prisma.telegramUser.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем, не отвечал ли пользователь уже на этот вопрос
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        questionId,
        userId,
      },
    });
    
    if (existingAnswer) {
      // Обновляем существующий ответ
      const updatedAnswer = await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: { text },
      });
      
      return res.status(200).json(updatedAnswer);
    }
    
    // Создаем новый ответ
    const answer = await prisma.answer.create({
      data: {
        questionId,
        userId,
        text,
      },
    });
    
    return res.status(201).json(answer);
  } catch (error) {
    console.error('Ошибка при создании ответа:', error);
    return res.status(500).json({ error: 'Failed to create answer', details: error.message });
  }
} 