import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return getBlocks(req, res);
    case 'POST':
      return createBlock(req, res);
    case 'DELETE':
      return deleteBlock(req, res);
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

// Удаление блока
async function deleteBlock(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Block ID is required' });
    }
    
    const blockId = parseInt(id);
    
    // Проверяем, есть ли вопросы, связанные с этим блоком
    const questionsCount = await prisma.question.count({
      where: { blockId },
    });
    
    if (questionsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete block with associated questions',
        message: 'Невозможно удалить блок, так как с ним связаны вопросы. Сначала удалите все вопросы этого блока.'
      });
    }
    
    // Удаляем блок
    await prisma.block.delete({
      where: { id: blockId },
    });
    
    return res.status(200).json({ success: true, message: 'Блок успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении блока:', error);
    
    // Обработка ошибки, если блок не найден
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    return res.status(500).json({ error: 'Failed to delete block', details: error.message });
  }
} 