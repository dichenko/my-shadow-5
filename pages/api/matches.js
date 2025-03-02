import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  // Только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Преобразуем ID в число, если это строка
    const userIdNumber = parseInt(userId, 10);
    
    // Находим пару пользователя с включением информации о пользователях
    const userPair = await prisma.pairs.findFirst({
      where: {
        OR: [
          { user1Id: userIdNumber },
          { user2Id: userIdNumber }
        ],
        // Только активные пары
        status: 'active'
      },
      include: {
        user1: {
          select: {
            id: true,
            telegramId: true,
            first_name: true,
            username: true,
            language_code: true,
            created_at: true
          }
        },
        user2: {
          select: {
            id: true,
            telegramId: true,
            first_name: true,
            username: true,
            language_code: true,
            created_at: true
          }
        }
      }
    });

    if (!userPair) {
      return res.status(200).json({ 
        hasPair: false,
        message: 'User has no active pair',
        matches: []
      });
    }

    // Определяем, кто является партнером
    const partnerId = userPair.user1Id === userIdNumber ? userPair.user2Id : userPair.user1Id;
    const partner = userPair.user1Id === userIdNumber ? userPair.user2 : userPair.user1;

    // Получаем ответы обоих пользователей в одном запросе
    const [userAnswers, partnerAnswers] = await Promise.all([
      prisma.answers.findMany({
        where: {
          userId: userIdNumber
        },
        select: {
          id: true,
          questionId: true,
          answer: true,
          answeredAt: true,
          question: {
            select: {
              id: true,
              text: true,
              type: true,
              blockId: true,
              question_number: true
            }
          }
        }
      }),
      prisma.answers.findMany({
        where: {
          userId: partnerId
        },
        select: {
          id: true,
          questionId: true,
          answer: true,
          answeredAt: true,
          question: {
            select: {
              id: true,
              text: true,
              type: true,
              blockId: true,
              question_number: true
            }
          }
        }
      })
    ]);

    // Создаем Map для быстрого поиска ответов партнера по questionId
    const partnerAnswersMap = new Map();
    partnerAnswers.forEach(answer => {
      partnerAnswersMap.set(answer.questionId, answer);
    });

    // Находим совпадения (вопросы, на которые ответили оба пользователя)
    const matches = userAnswers
      .filter(userAnswer => partnerAnswersMap.has(userAnswer.questionId))
      .map(userAnswer => {
        const partnerAnswer = partnerAnswersMap.get(userAnswer.questionId);
        
        return {
          questionId: userAnswer.questionId,
          questionText: userAnswer.question.text,
          questionType: userAnswer.question.type,
          blockId: userAnswer.question.blockId,
          userAnswer: userAnswer.answer,
          partnerAnswer: partnerAnswer.answer,
          // Определяем, совпали ли ответы (для вопросов типа "yes_no")
          isMatch: userAnswer.question.type === 'yes_no' ? 
                   userAnswer.answer === partnerAnswer.answer && userAnswer.answer === 'yes' : null
        };
      });

    // Подсчитываем статистику
    const totalMatches = matches.filter(m => m.isMatch === true).length;

    return res.status(200).json({
      hasPair: true,
      pairId: userPair.id,
      pairStatus: userPair.status,
      partner: {
        id: partner.id,
        telegramId: partner.telegramId,
        firstName: partner.first_name,
        username: partner.username
      },
      matches: matches,
      // Добавляем статистику
      stats: {
        totalMatches,
        totalQuestions: matches.length,
        userAnsweredCount: userAnswers.length,
        partnerAnsweredCount: partnerAnswers.length
      }
    });
  } catch (error) {
    console.error('Error fetching matches data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 