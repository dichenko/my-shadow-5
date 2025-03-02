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
        // Проверяем существование вопроса и пользователя в одном запросе
        // Добавляем дополнительное логирование для отладки
        console.log('Ищем вопрос с ID:', questionId, 'Тип:', typeof questionId);
        
        // Убедимся, что questionId корректно преобразуется в число
        let questionIdInt;
        try {
          questionIdInt = parseInt(questionId, 10);
          if (isNaN(questionIdInt)) {
            console.error('Некорректный ID вопроса:', questionId);
            return res.status(400).json({ error: 'Некорректный ID вопроса' });
          }
        } catch (parseError) {
          console.error('Ошибка при преобразовании ID вопроса:', parseError);
          return res.status(400).json({ error: 'Ошибка при преобразовании ID вопроса' });
        }
        
        const [question, userById, userByTgId] = await Promise.all([
          prisma.question.findUnique({
            where: { id: questionIdInt }
          }),
          prisma.telegramUser.findUnique({
            where: { id: parseInt(userId, 10) }
          }),
          prisma.telegramUser.findUnique({
            where: { tgId: parseInt(userId, 10) }
          })
        ]);

        // Дополнительное логирование результата поиска вопроса
        console.log('Результат поиска вопроса:', question ? 'Найден' : 'Не найден');
        
        if (!question) {
          console.error('Вопрос не найден:', questionId);
          return res.status(404).json({ error: 'Вопрос не найден' });
        }

        // Определяем пользователя
        let user = userById || userByTgId;

        // Если пользователь все еще не найден, пытаемся использовать userId из localStorage
        if (!user && typeof window !== 'undefined') {
          const localStorageUserId = localStorage.getItem('userId');
          if (localStorageUserId) {
            console.log('Пытаемся найти пользователя по userId из localStorage:', localStorageUserId);
            user = await prisma.telegramUser.findUnique({
              where: { id: parseInt(localStorageUserId) }
            });
          }
        }

        if (!user) {
          console.error('Пользователь не найден ни по id, ни по tgId:', userId);
          
          // Если пользователь не найден, попытаемся создать его на основе Telegram ID
          try {
            console.log('Попытка создать пользователя с tgId:', userId);
            user = await prisma.telegramUser.create({
              data: {
                tgId: parseInt(userId),
                firstVisit: new Date(),
                lastVisit: new Date(),
                visitCount: 1
              }
            });
            console.log('Создан новый пользователь:', user);
          } catch (createError) {
            console.error('Ошибка при создании пользователя:', createError);
            return res.status(404).json({ 
              error: 'Пользователь не найден. Пожалуйста, перезагрузите приложение или попробуйте войти заново.' 
            });
          }
        }

        // Проверяем, существует ли уже ответ на этот вопрос от этого пользователя
        // и обновляем или создаем ответ в одной транзакции
        const answer = await prisma.$transaction(async (tx) => {
          const existingAnswer = await tx.answer.findFirst({
            where: {
              questionId: questionIdInt,
              userId: user.id
            }
          });

          if (existingAnswer) {
            // Обновляем существующий ответ
            return tx.answer.update({
              where: { id: existingAnswer.id },
              data: { text }
            });
          } else {
            // Создаем новый ответ
            return tx.answer.create({
              data: {
                questionId: questionIdInt,
                userId: user.id,
                text
              }
            });
          }
        });

        console.log('Ответ сохранен:', answer);
        return res.status(200).json(answer);
      } catch (dbError) {
        console.error('Ошибка при работе с базой данных:', dbError);
        return res.status(500).json({ error: 'Ошибка при работе с базой данных', details: dbError.message });
      }
    } catch (error) {
      console.error('Общая ошибка при создании/обновлении ответа:', error);
      return res.status(500).json({ error: 'Не удалось создать/обновить ответ', details: error.message });
    }
  }

  // Обработка GET запроса для получения ответов - требуется аутентификация администратора
  if (req.method === 'GET') {
    try {
      const isAuthenticated = await checkAdminAuth(req);

      if (!isAuthenticated) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { page = '1', limit = '50', userId, questionId, blockId } = req.query;
      
      // Преобразуем параметры пагинации в числа
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      
      // Формируем условия фильтрации
      let where = {};
      
      if (userId) {
        where.userId = parseInt(userId);
      }
      
      if (questionId) {
        where.questionId = parseInt(questionId);
      }
      
      if (blockId) {
        where.question = {
          blockId: parseInt(blockId)
        };
      }

      // Получаем ответы с пагинацией и общее количество в одном запросе
      const [answers, total] = await Promise.all([
        prisma.answer.findMany({
          where,
          skip,
          take: limitNum,
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
        }),
        prisma.answer.count({ where })
      ]);

      return res.status(200).json({
        answers,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Ошибка при получении ответов:', error);
      return res.status(500).json({ error: 'Не удалось получить ответы' });
    }
  }

  // Если метод не поддерживается
  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 