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
  // Проверка аутентификации
  const isAuthenticated = await checkAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Обработка GET запроса
  if (req.method === 'GET') {
    try {
      const blocks = await prisma.block.findMany({
        orderBy: {
          order: 'asc',
        },
      });
      
      return res.status(200).json(blocks);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      return res.status(500).json({ message: 'Failed to fetch blocks' });
    }
  }
  
  // Обработка POST запроса
  if (req.method === 'POST') {
    const { name } = req.body;
    
    // Проверка наличия обязательных полей
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    try {
      // Получаем максимальный порядок
      const maxOrderBlock = await prisma.block.findFirst({
        orderBy: {
          order: 'desc',
        },
      });
      
      const newOrder = maxOrderBlock ? maxOrderBlock.order + 1 : 1;
      
      // Создаем новый блок
      const block = await prisma.block.create({
        data: {
          name,
          order: newOrder,
        },
      });
      
      return res.status(201).json(block);
    } catch (error) {
      console.error('Error creating block:', error);
      return res.status(500).json({ message: 'Failed to create block' });
    }
  }
  
  // Обработка PUT запроса
  if (req.method === 'PUT') {
    const { id, name, order } = req.body;
    
    // Проверка наличия обязательных полей
    if (!id || !name) {
      return res.status(400).json({ message: 'ID and name are required' });
    }
    
    try {
      // Обновляем блок
      const block = await prisma.block.update({
        where: { id: parseInt(id) },
        data: {
          name,
          order: order ? parseInt(order) : undefined,
        },
      });
      
      return res.status(200).json(block);
    } catch (error) {
      console.error('Error updating block:', error);
      return res.status(500).json({ message: 'Failed to update block' });
    }
  }
  
  // Обработка DELETE запроса
  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'ID is required' });
    }
    
    try {
      // Проверяем, есть ли вопросы, связанные с этим блоком
      const questionsCount = await prisma.question.count({
        where: { blockId: parseInt(id) },
      });
      
      if (questionsCount > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete block with associated questions. Delete the questions first.' 
        });
      }
      
      // Удаляем блок
      await prisma.block.delete({
        where: { id: parseInt(id) },
      });
      
      // Перенумеруем оставшиеся блоки
      const remainingBlocks = await prisma.block.findMany({
        orderBy: { order: 'asc' },
      });
      
      for (let i = 0; i < remainingBlocks.length; i++) {
        await prisma.block.update({
          where: { id: remainingBlocks[i].id },
          data: { order: i + 1 },
        });
      }
      
      return res.status(200).json({ message: 'Block deleted successfully' });
    } catch (error) {
      console.error('Error deleting block:', error);
      return res.status(500).json({ message: 'Failed to delete block' });
    }
  }
  
  // Если метод не поддерживается
  return res.status(405).json({ message: 'Method not allowed' });
} 