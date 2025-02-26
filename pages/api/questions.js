import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getQuestions(req, res);
    case 'POST':
      return createQuestion(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Получение списка вопросов
async function getQuestions(req, res) {
  try {
    const { blockId, practiceId, role } = req.query;
    
    // Формируем условия фильтрации
    const where = {};
    
    if (blockId) {
      where.blockId = parseInt(blockId);
    }
    
    if (practiceId) {
      where.practiceId = parseInt(practiceId);
    }
    
    if (role) {
      where.role = role;
    }
    
    const questions = await prisma.question.findMany({
      where,
      include: {
        block: true,
        practice: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
    
    return res.status(200).json(questions);
  } catch (error) {
    console.error('Ошибка при получении списка вопросов:', error);
    return res.status(500).json({ error: 'Failed to fetch questions', details: error.message });
  }
}

// Создание нового вопроса
async function createQuestion(req, res) {
  try {
    const { text, blockId, practiceId, role = 'none' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    if (!blockId) {
      return res.status(400).json({ error: 'Block ID is required' });
    }
    
    if (!practiceId) {
      return res.status(400).json({ error: 'Practice ID is required' });
    }
    
    // Проверяем существование блока и практики
    const block = await prisma.block.findUnique({
      where: { id: blockId },
    });
    
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
    });
    
    if (!practice) {
      return res.status(404).json({ error: 'Practice not found' });
    }
    
    const question = await prisma.question.create({
      data: {
        text,
        blockId,
        practiceId,
        role,
      },
    });
    
    return res.status(201).json(question);
  } catch (error) {
    console.error('Ошибка при создании вопроса:', error);
    return res.status(500).json({ error: 'Failed to create question', details: error.message });
  }
} 