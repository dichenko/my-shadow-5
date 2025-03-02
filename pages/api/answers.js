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
        // Проверяем корректность формата questionId
        let questionIdInt;
        try {
          questionIdInt = parseInt(questionId, 10);
          if (isNaN(questionIdInt) || questionIdInt <= 0) {
            console.error('Некорректный ID вопроса:', questionId, 'Тип:', typeof questionId);
            return res.status(400).json({ error: 'Некорректный ID вопроса' });
          }
        } catch (parseError) {
          console.error('Ошибка при преобразовании ID вопроса:', parseError, 'Значение:', questionId);
          return res.status(400).json({ error: 'Ошибка при преобразовании ID вопроса' });
        }
        
        console.log('Ищем вопрос с ID:', questionIdInt, 'Тип:', typeof questionIdInt);
        
        // Сначала проверяем существование вопроса
        const question = await prisma.question.findUnique({
          where: { id: questionIdInt }
        });
        
        // Более подробное логирование результата поиска вопроса
        if (!question) {
          console.error(`Вопрос с ID ${questionIdInt} не найден в базе данных`);
          return res.status(404).json({ error: 'Вопрос не найден' });
        }
        
        console.log(`Вопрос с ID ${questionIdInt} найден:`, { 
          id: question.id, 
          blockId: question.blockId,
          text: question.text?.substring(0, 30) + '...' // Логируем только начало текста для компактности
        });
        
        // После проверки вопроса ищем пользователя
        let userById = null;
        let userByTgId = null;
        
        // Проверяем формат userId
        let userIdInt;
        try {
          userIdInt = parseInt(userId, 10);
          if (isNaN(userIdInt)) {
            console.warn('Некорректный ID пользователя:', userId, 'Тип:', typeof userId);
            // Продолжаем выполнение, так как userId может быть в другом формате
          }
        } catch (parseError) {
          console.warn('Ошибка при преобразовании ID пользователя:', parseError);
          // Продолжаем выполнение, возможно userId не числовой
        }
        
        // Получаем пользователя из базы данных несколькими способами
        if (!isNaN(userIdInt)) {
          [userById, userByTgId] = await Promise.all([
            prisma.telegramUser.findUnique({
              where: { id: userIdInt }
            }),
            prisma.telegramUser.findUnique({
              where: { tgId: userIdInt }
            })
          ]);
        }
        
        // Определяем пользователя
        let user = userById || userByTgId;
        
        if (!user) {
          console.error('Пользователь не найден ни по id, ни по tgId:', userId);
          
          // Если пользователь не найден, попытаемся создать его на основе Telegram ID
          try {
            if (!isNaN(userIdInt)) {
              console.log('Попытка создать пользователя с tgId:', userIdInt);
              user = await prisma.telegramUser.create({
                data: {
                  tgId: userIdInt,
                  firstVisit: new Date(),
                  lastVisit: new Date(),
                  visitCount: 1
                }
              });
              console.log('Создан новый пользователь:', user);
            } else {
              return res.status(400).json({ error: 'Некорректный ID пользователя для создания' });
            }
          } catch (createError) {
            console.error('Ошибка при создании пользователя:', createError);
            return res.status(404).json({ 
              error: 'Пользователь не найден. Пожалуйста, перезагрузите приложение или попробуйте войти заново.' 
            });
          }
        }

        // Проверяем наличие пользователя после всех попыток
        if (!user) {
          return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Проверяем, не отвечал ли пользователь уже на этот вопрос
        const existingAnswer = await prisma.answer.findFirst({
          where: {
            userId: user.id,
            questionId: questionIdInt
          }
        });

        if (existingAnswer) {
          console.log('Пользователь уже отвечал на этот вопрос:', existingAnswer);
          // Возвращаем успешный ответ, чтобы клиент мог продолжить работу
          return res.status(200).json({ 
            message: 'Ответ уже существует', 
            id: existingAnswer.id 
          });
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