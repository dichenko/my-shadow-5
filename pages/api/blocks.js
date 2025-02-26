import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getBlocks(req, res);
    case 'POST':
      return createBlock(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Получение списка блоков
async function getBlocks(req, res) {
  try {
    const blocks = await prisma.block.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    
    return res.status(200).json(blocks);
  } catch (error) {
    console.error('Ошибка при получении списка блоков:', error);
    return res.status(500).json({ error: 'Failed to fetch blocks', details: error.message });
  }
}

// Создание нового блока
async function createBlock(req, res) {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const block = await prisma.block.create({
      data: {
        name,
      },
    });
    
    return res.status(201).json(block);
  } catch (error) {
    console.error('Ошибка при создании блока:', error);
    return res.status(500).json({ error: 'Failed to create block', details: error.message });
  }
} 