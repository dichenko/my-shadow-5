import prisma from '../../lib/prisma';
import { checkAdminAuth } from '../../utils/auth';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getPractices(req, res);
    case 'POST':
      return createPractice(req, res);
    case 'DELETE':
      return deletePractice(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Получение списка практик
async function getPractices(req, res) {
  try {
    const practices = await prisma.practice.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    
    return res.status(200).json(practices);
  } catch (error) {
    console.error('Ошибка при получении списка практик:', error);
    return res.status(500).json({ error: 'Не удалось получить список практик' });
  }
}

// Создание новой практики
async function createPractice(req, res) {
  try {
    // Проверяем аутентификацию администратора
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Необходимо указать name' });
    }
    
    const practice = await prisma.practice.create({
      data: {
        name,
      },
    });
    
    return res.status(201).json(practice);
  } catch (error) {
    console.error('Ошибка при создании практики:', error);
    return res.status(500).json({ error: 'Не удалось создать практику' });
  }
}

// Удаление практики
async function deletePractice(req, res) {
  try {
    // Проверяем аутентификацию администратора
    const isAuthenticated = await checkAdminAuth(req);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Необходимо указать ID практики' });
    }
    
    const practiceId = parseInt(id);
    
    // Проверяем, есть ли вопросы, связанные с этой практикой
    const questionsCount = await prisma.question.count({
      where: { practiceId },
    });
    
    if (questionsCount > 0) {
      return res.status(400).json({ 
        error: 'Невозможно удалить практику, так как с ней связаны вопросы. Сначала удалите все вопросы этой практики.'
      });
    }
    
    // Удаляем практику
    await prisma.practice.delete({
      where: { id: practiceId },
    });
    
    return res.status(200).json({ success: true, message: 'Практика успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении практики:', error);
    
    // Обработка ошибки, если практика не найдена
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Практика не найдена' });
    }
    
    return res.status(500).json({ error: 'Не удалось удалить практику' });
  }
} 