import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getPractices(req, res);
    case 'POST':
      return createPractice(req, res);
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