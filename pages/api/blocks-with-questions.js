import prisma from '../../lib/prisma';
import { parse } from 'cookie';

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
  // Обрабатываем только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    // Если указан id, возвращаем конкретный блок с вопросами (доступно без аутентификации)
    if (id) {
      const block = await prisma.block.findUnique({
        where: { id: parseInt(id) },
      });
      
      if (!block) {
        return res.status(404).json({ message: 'Block not found' });
      }
      
      // Получаем вопросы для этого блока
      const questions = await prisma.question.findMany({
        where: { blockId: parseInt(id) },
        orderBy: [
          { order: 'asc' },
          { id: 'asc' }
        ],
      });
      
      return res.status(200).json({
        ...block,
        questions,
      });
    }
    
    // Получаем все блоки (доступно без аутентификации)
    const blocks = await prisma.block.findMany({
      orderBy: [
        { order: 'asc' },
        { id: 'asc' }
      ],
    });

    // Для каждого блока считаем количество вопросов
    const blocksWithQuestionCount = await Promise.all(
      blocks.map(async (block) => {
        const questionsCount = await prisma.question.count({
          where: { blockId: block.id },
        });
        return {
          ...block,
          questionsCount, // Используем questionsCount вместо questionCount для совместимости
        };
      })
    );

    return res.status(200).json(blocksWithQuestionCount);
  } catch (error) {
    console.error('Error fetching blocks with questions:', error);
    return res.status(500).json({ message: 'Failed to fetch blocks with questions' });
  }
} 