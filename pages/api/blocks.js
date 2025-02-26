import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Получение блоков
        if (req.query.id) {
          // Получение конкретного блока по ID
          const block = await prisma.block.findUnique({
            where: {
              id: parseInt(req.query.id)
            }
          });
          
          if (!block) {
            return res.status(404).json({ success: false, message: 'Блок не найден' });
          }
          
          return res.status(200).json(block);
        } else if (req.query.practiceId) {
          // Получение всех блоков для конкретной практики
          const blocks = await prisma.block.findMany({
            where: { 
              practiceId: parseInt(req.query.practiceId) 
            },
            orderBy: [
              {
                order: 'asc',
              },
              {
                id: 'asc',
              },
            ],
          });
          
          return res.status(200).json(blocks);
        } else {
          // Получение всех блоков
          const blocks = await prisma.block.findMany({
            orderBy: [
              {
                order: 'asc',
              },
              {
                id: 'asc',
              },
            ],
          });
          
          return res.status(200).json(blocks);
        }
        
      case 'POST':
        // Создание нового блока
        if (!req.body.name || !req.body.practiceId) {
          return res.status(400).json({ success: false, message: 'Отсутствуют обязательные поля' });
        }
        
        const newBlock = await prisma.block.create({
          data: {
            name: req.body.name,
            practiceId: parseInt(req.body.practiceId),
            order: req.body.order ? parseInt(req.body.order) : null
          }
        });
        
        return res.status(201).json({
          success: true,
          ...newBlock
        });
        
      case 'PUT':
        // Обновление существующего блока
        if (!req.body.id) {
          return res.status(400).json({ success: false, message: 'ID блока не указан' });
        }
        
        const updateData = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.practiceId) updateData.practiceId = parseInt(req.body.practiceId);
        if (req.body.order !== undefined) updateData.order = req.body.order ? parseInt(req.body.order) : null;
        
        try {
          const updatedBlock = await prisma.block.update({
            where: {
              id: parseInt(req.body.id)
            },
            data: updateData
          });
          
          return res.status(200).json({ success: true, message: 'Блок обновлен', block: updatedBlock });
        } catch (error) {
          if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Блок не найден' });
          }
          throw error;
        }
        
      case 'DELETE':
        // Удаление блока
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'ID блока не указан' });
        }
        
        const blockId = parseInt(req.query.id);
        
        // Сначала удаляем все вопросы, связанные с этим блоком
        await prisma.question.deleteMany({
          where: { blockId: blockId }
        });
        
        // Затем удаляем сам блок
        try {
          await prisma.block.delete({
            where: {
              id: blockId
            }
          });
          
          return res.status(200).json({ success: true, message: 'Блок и связанные вопросы удалены' });
        } catch (error) {
          if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Блок не найден' });
          }
          throw error;
        }
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, message: `Метод ${method} не разрешен` });
    }
  } catch (error) {
    console.error('Ошибка API блоков:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера', error: error.message });
  }
} 