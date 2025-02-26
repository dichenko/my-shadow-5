import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getPractices(req, res);
    case 'POST':
      return createPractice(req, res);
    case 'DELETE':
      return deletePractice(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
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
    return res.status(500).json({ error: 'Failed to fetch practices', details: error.message });
  }
}

// Создание новой практики
async function createPractice(req, res) {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const practice = await prisma.practice.create({
      data: {
        name,
      },
    });
    
    return res.status(201).json(practice);
  } catch (error) {
    console.error('Ошибка при создании практики:', error);
    return res.status(500).json({ error: 'Failed to create practice', details: error.message });
  }
}

// Удаление практики
async function deletePractice(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Practice ID is required' });
    }
    
    const practiceId = parseInt(id);
    
    // Проверяем, есть ли вопросы, связанные с этой практикой
    const questionsCount = await prisma.question.count({
      where: { practiceId },
    });
    
    if (questionsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete practice with associated questions',
        message: 'Невозможно удалить практику, так как с ней связаны вопросы. Сначала удалите все вопросы этой практики.'
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
      return res.status(404).json({ error: 'Practice not found' });
    }
    
    return res.status(500).json({ error: 'Failed to delete practice', details: error.message });
  }
} 