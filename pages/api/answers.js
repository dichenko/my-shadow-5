import prisma from '../../lib/prisma';
import { checkAdminAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Обработка POST запроса для создания ответа - доступно без аутентификации
  if (req.method === 'POST') {
    try {
      const { questionId, userId, text } = req.body;

      // Проверяем наличие необходимых данных
      if (!questionId || !userId || !text) {
        return res.status(400).json({ error: 'Необходимо указать questionId, userId и text' });
      }

      // Проверяем, существует ли вопрос
      const question = await prisma.question.findUnique({
        where: { id: parseInt(questionId) }
      });

      if (!question) {
        return res.status(404).json({ error: 'Вопрос не найден' });
      }

      // Проверяем, существует ли пользователь
      const user = await prisma.telegramUser.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      // Проверяем, существует ли уже ответ на этот вопрос от этого пользователя
      const existingAnswer = await prisma.answer.findFirst({
        where: {
          questionId: parseInt(questionId),
          userId: parseInt(userId)
        }
      });

      let answer;

      if (existingAnswer) {
        // Обновляем существующий ответ
        answer = await prisma.answer.update({
          where: { id: existingAnswer.id },
          data: { text }
        });
      } else {
        // Создаем новый ответ
        answer = await prisma.answer.create({
          data: {
            questionId: parseInt(questionId),
            userId: parseInt(userId),
            text
          }
        });
      }

      return res.status(200).json(answer);
    } catch (error) {
      console.error('Ошибка при создании/обновлении ответа:', error);
      return res.status(500).json({ error: 'Не удалось создать/обновить ответ' });
    }
  }

  // Обработка GET запроса для получения ответов - требуется аутентификация администратора
  if (req.method === 'GET') {
    try {
      const isAuthenticated = await checkAdminAuth(req);

      if (!isAuthenticated) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Получаем все ответы с информацией о вопросе и пользователе
      const answers = await prisma.answer.findMany({
        take: 100, // Ограничиваем количество результатов
        orderBy: {
          createdAt: 'desc' // Сортируем по дате создания (сначала новые)
        },
        include: {
          question: {
            include: {
              block: true,
              practice: true
            }
          },
          user: true
        }
      });

      return res.status(200).json(answers);
    } catch (error) {
      console.error('Ошибка при получении ответов:', error);
      return res.status(500).json({ error: 'Не удалось получить ответы' });
    }
  }

  // Если метод не поддерживается
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 