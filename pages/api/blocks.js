import prisma from '../../lib/prisma';
import { checkAdminAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Обработка GET запроса для получения блоков
  if (req.method === 'GET') {
    try {
      // Получаем все блоки, отсортированные по полю order
      const blocks = await prisma.block.findMany({
        orderBy: {
          order: 'asc'
        }
      });
      
      return res.status(200).json(blocks);
    } catch (error) {
      console.error('Ошибка при получении блоков:', error);
      return res.status(500).json({ error: 'Не удалось получить блоки' });
    }
  }

  // Для остальных методов требуется аутентификация администратора
  const isAuthenticated = await checkAdminAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Обработка POST запроса для создания блока
  if (req.method === 'POST') {
    try {
      const { name, order } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Необходимо указать name' });
      }
      
      const block = await prisma.block.create({
        data: {
          name,
          order: order || null
        }
      });
      
      return res.status(201).json(block);
    } catch (error) {
      console.error('Ошибка при создании блока:', error);
      return res.status(500).json({ error: 'Не удалось создать блок' });
    }
  }

  // Обработка PUT запроса для обновления блока
  if (req.method === 'PUT') {
    try {
      const { id, name, order } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({ error: 'Необходимо указать id и name' });
      }
      
      const block = await prisma.block.update({
        where: { id: parseInt(id) },
        data: {
          name,
          order: order || null
        }
      });
      
      return res.status(200).json(block);
    } catch (error) {
      console.error('Ошибка при обновлении блока:', error);
      return res.status(500).json({ error: 'Не удалось обновить блок' });
    }
  }

  // Обработка DELETE запроса для удаления блока
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Необходимо указать id' });
      }
      
      // Проверяем, есть ли вопросы, связанные с этим блоком
      const questionsCount = await prisma.question.count({
        where: { blockId: parseInt(id) }
      });
      
      if (questionsCount > 0) {
        return res.status(400).json({ 
          error: 'Невозможно удалить блок, так как с ним связаны вопросы. Сначала удалите все вопросы в этом блоке.' 
        });
      }
      
      await prisma.block.delete({
        where: { id: parseInt(id) }
      });
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Ошибка при удалении блока:', error);
      return res.status(500).json({ error: 'Не удалось удалить блок' });
    }
  }

  // Если метод не поддерживается
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 