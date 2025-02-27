import prisma from '../../lib/prisma';
import { checkAdminAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Устанавливаем заголовки CORS для всех запросов
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обработка OPTIONS запроса (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Обработка POST запроса для создания ответа - доступно без аутентификации
  if (req.method === 'POST') {
    try {
      const { questionId, userId, text } = req.body;

      console.log('Попытка сохранить ответ:', { questionId, userId, text });

      // Проверяем наличие необходимых данных
      if (!questionId || !userId || !text) {
        console.error('Отсутствуют необходимые данные:', { questionId, userId, text });
        return res.status(400).json({ error: 'Необходимо указать questionId, userId и text' });
      }

      try {
        // Проверяем, существует ли вопрос
        const question = await prisma.question.findUnique({
          where: { id: parseInt(questionId) }
        });

        if (!question) {
          console.error('Вопрос не найден:', questionId);
          return res.status(404).json({ error: 'Вопрос не найден' });
        }

        // Проверяем, существует ли пользователь
        const user = await prisma.telegramUser.findUnique({
          where: { id: parseInt(userId) }
        });

        if (!user) {
          console.error('Пользователь не найден:', userId);
          // Вместо попытки создать пользователя, который уже должен быть создан при авторизации,
          // вернем ошибку с более информативным сообщением
          return res.status(404).json({ 
            error: 'Пользователь не найден. Пожалуйста, перезагрузите приложение или попробуйте войти заново.' 
          });
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
          console.log('Обновлен существующий ответ:', answer);
        } else {
          // Создаем новый ответ
          answer = await prisma.answer.create({
            data: {
              questionId: parseInt(questionId),
              userId: parseInt(userId),
              text
            }
          });
          console.log('Создан новый ответ:', answer);
        }

        return res.status(200).json(answer);
      } catch (dbError) {
        console.error('Ошибка при работе с базой данных:', dbError);
        return res.status(500).json({ error: 'Ошибка при работе с базой данных' });
      }
    } catch (error) {
      console.error('Общая ошибка при создании/обновлении ответа:', error);
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
  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 