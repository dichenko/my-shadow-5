import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Получение вопросов
        if (req.query.id) {
          // Получение конкретного вопроса по ID
          const question = await prisma.question.findUnique({
            where: {
              id: parseInt(req.query.id)
            }
          });
          
          if (!question) {
            return res.status(404).json({ success: false, message: 'Вопрос не найден' });
          }
          
          return res.status(200).json(question);
        } else if (req.query.blockId) {
          // Получение всех вопросов для конкретного блока
          const questions = await prisma.question.findMany({
            where: { 
              blockId: parseInt(req.query.blockId) 
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
          
          return res.status(200).json(questions);
        } else {
          // Получение всех вопросов
          const questions = await prisma.question.findMany({
            orderBy: [
              {
                order: 'asc',
              },
              {
                id: 'asc',
              },
            ],
          });
          
          return res.status(200).json(questions);
        }
        
      case 'POST':
        // Создание нового вопроса
        if (!req.body.text || !req.body.role || !req.body.blockId) {
          return res.status(400).json({ success: false, message: 'Отсутствуют обязательные поля' });
        }
        
        const newQuestion = await prisma.question.create({
          data: {
            text: req.body.text,
            role: req.body.role,
            blockId: parseInt(req.body.blockId),
            practiceId: parseInt(req.body.practiceId),
            order: req.body.order ? parseInt(req.body.order) : null
          }
        });
        
        return res.status(201).json({
          success: true,
          ...newQuestion
        });
        
      case 'PUT':
        // Обновление существующего вопроса
        if (!req.body.id) {
          return res.status(400).json({ success: false, message: 'ID вопроса не указан' });
        }
        
        const updateData = {};
        if (req.body.text) updateData.text = req.body.text;
        if (req.body.role) updateData.role = req.body.role;
        if (req.body.blockId) updateData.blockId = parseInt(req.body.blockId);
        if (req.body.practiceId) updateData.practiceId = parseInt(req.body.practiceId);
        if (req.body.order !== undefined) updateData.order = req.body.order ? parseInt(req.body.order) : null;
        
        try {
          const updatedQuestion = await prisma.question.update({
            where: {
              id: parseInt(req.body.id)
            },
            data: updateData
          });
          
          return res.status(200).json({ success: true, message: 'Вопрос обновлен', question: updatedQuestion });
        } catch (error) {
          if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Вопрос не найден' });
          }
          throw error;
        }
        
      case 'DELETE':
        // Удаление вопроса
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'ID вопроса не указан' });
        }
        
        try {
          await prisma.question.delete({
            where: {
              id: parseInt(req.query.id)
            }
          });
          
          return res.status(200).json({ success: true, message: 'Вопрос удален' });
        } catch (error) {
          if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Вопрос не найден' });
          }
          throw error;
        }
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, message: `Метод ${method} не разрешен` });
    }
  } catch (error) {
    console.error('Ошибка API вопросов:', error);
    return res.status(500).json({ success: false, message: 'Ошибка сервера', error: error.message });
  }
} 