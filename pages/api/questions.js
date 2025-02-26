import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Проверка аутентификации
  const session = await getSession({ req });
  if (!session || !session.user.isAdmin) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Обработка GET запроса
  if (req.method === 'GET') {
    try {
      const questions = await prisma.question.findMany({
        orderBy: [
          { blockId: 'asc' },
          { order: 'asc' }
        ],
      });
      
      return res.status(200).json(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      return res.status(500).json({ message: 'Failed to fetch questions' });
    }
  }
  
  // Обработка POST запроса
  if (req.method === 'POST') {
    const { text, blockId, practiceId, role } = req.body;
    
    // Проверка наличия обязательных полей
    if (!text || !blockId || !practiceId) {
      return res.status(400).json({ message: 'Text, blockId, and practiceId are required' });
    }
    
    try {
      // Проверяем существование блока и практики
      const block = await prisma.block.findUnique({
        where: { id: parseInt(blockId) },
      });
      
      if (!block) {
        return res.status(400).json({ message: 'Block not found' });
      }
      
      const practice = await prisma.practice.findUnique({
        where: { id: parseInt(practiceId) },
      });
      
      if (!practice) {
        return res.status(400).json({ message: 'Practice not found' });
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
      console.error('Error creating question:', error);
      return res.status(500).json({ message: 'Failed to create question' });
    }
  }
  
  // Обработка PUT запроса
  if (req.method === 'PUT') {
    const { id, text, blockId, practiceId, order, role } = req.body;
    
    // Проверка наличия обязательных полей
    if (!id || !text) {
      return res.status(400).json({ message: 'ID and text are required' });
    }
    
    try {
      // Если указаны blockId или practiceId, проверяем их существование
      if (blockId) {
        const block = await prisma.block.findUnique({
          where: { id: parseInt(blockId) },
        });
        
        if (!block) {
          return res.status(400).json({ message: 'Block not found' });
        }
      }
      
      if (practiceId) {
        const practice = await prisma.practice.findUnique({
          where: { id: parseInt(practiceId) },
        });
        
        if (!practice) {
          return res.status(400).json({ message: 'Practice not found' });
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
      console.error('Error updating question:', error);
      return res.status(500).json({ message: 'Failed to update question' });
    }
  }
  
  // Обработка DELETE запроса
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }
    
    try {
      // Проверяем, есть ли ответы на этот вопрос
      const answersCount = await prisma.answer.count({
        where: { questionId: parseInt(id) },
      });
      
      if (answersCount > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete question with associated answers. Delete the answers first.' 
        });
      }
      
      // Получаем информацию о вопросе перед удалением
      const question = await prisma.question.findUnique({
        where: { id: parseInt(id) },
      });
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
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
      
      return res.status(200).json({ message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ message: 'Failed to delete question' });
    }
  }
  
  // Если метод не поддерживается
  return res.status(405).json({ message: 'Method not allowed' });
} 