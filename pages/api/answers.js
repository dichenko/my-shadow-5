import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';

const prisma = new PrismaClient();

// Простая проверка аутентификации на основе cookie
async function checkAuth(req) {
  try {
    // Получаем cookie из запроса
    const cookies = parse(req.headers.cookie || '');
    const adminToken = cookies.adminToken;
    
    // Проверяем токен администратора
    return adminToken === process.env.ADMIN_PASSWORD;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации:', error);
    return false;
  }
}

export default async function handler(req, res) {
  // Обработка POST запроса для создания ответа - доступно без аутентификации
  if (req.method === 'POST') {
    try {
      const { questionId, userId, text } = req.body;
      
      // Проверка наличия обязательных полей
      if (!questionId || !userId || !text) {
        return res.status(400).json({ message: 'QuestionId, userId, and text are required' });
      }
      
      // Проверяем существование вопроса и пользователя
      const question = await prisma.question.findUnique({
        where: { id: parseInt(questionId) },
      });
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      const user = await prisma.telegramUser.findUnique({
        where: { id: parseInt(userId) },
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Проверяем, не отвечал ли пользователь уже на этот вопрос
      const existingAnswer = await prisma.answer.findFirst({
        where: {
          questionId: parseInt(questionId),
          userId: parseInt(userId),
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
          questionId: parseInt(questionId),
          userId: parseInt(userId),
          text,
        },
      });
      
      return res.status(201).json(answer);
    } catch (error) {
      console.error('Error creating answer:', error);
      return res.status(500).json({ message: 'Failed to create answer' });
    }
  }
  
  // Для GET запроса требуется аутентификация
  if (req.method === 'GET') {
    // Проверка аутентификации
    const isAuthenticated = await checkAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    try {
      const answers = await prisma.answer.findMany({
        orderBy: {
          id: 'desc',
        },
        take: 100, // Ограничиваем количество ответов для производительности
      });
      
      return res.status(200).json(answers);
    } catch (error) {
      console.error('Error fetching answers:', error);
      return res.status(500).json({ message: 'Failed to fetch answers' });
    }
  }
  
  // Если метод не поддерживается
  return res.status(405).json({ message: 'Method not allowed' });
} 