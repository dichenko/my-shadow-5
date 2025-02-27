import prisma from '../../lib/prisma';
import { checkAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Проверяем аутентификацию
  const user = await checkAuth(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Получаем текущего пользователя с информацией о партнере
      const currentUser = await prisma.telegramUser.findUnique({
        where: { id: user.id },
        include: { partner: true }
      });

      // Проверяем, что у пользователя есть партнер
      if (!currentUser.partnerId) {
        return res.status(400).json({ error: 'You do not have a partner' });
      }

      const partnerId = currentUser.partnerId;

      // Получаем ответы текущего пользователя
      const userAnswers = await prisma.answer.findMany({
        where: { userId: currentUser.id },
        include: {
          question: {
            include: {
              practice: true,
              block: true
            }
          }
        }
      });

      // Получаем ответы партнера
      const partnerAnswers = await prisma.answer.findMany({
        where: { userId: partnerId },
        include: {
          question: {
            include: {
              practice: true,
              block: true
            }
          }
        }
      });

      // Создаем словарь ответов партнера для быстрого поиска
      const partnerAnswersMap = {};
      partnerAnswers.forEach(answer => {
        partnerAnswersMap[answer.questionId] = answer;
      });

      // Находим совпадающие желания
      const matchingDesires = [];
      
      // Обрабатываем обычные вопросы (role=none)
      const regularMatches = userAnswers.filter(userAnswer => {
        // Проверяем, что у вопроса role=none
        if (userAnswer.question.role !== 'none') return false;
        
        // Проверяем, есть ли ответ партнера на этот вопрос
        const partnerAnswer = partnerAnswersMap[userAnswer.questionId];
        if (!partnerAnswer) return false;
        
        // Совпадение, если оба ответили "да" или "не уверен"
        return (
          (userAnswer.text === 'yes' || userAnswer.text === 'maybe') && 
          (partnerAnswer.text === 'yes' || partnerAnswer.text === 'maybe')
        );
      }).map(match => ({
        type: 'regular',
        questionId: match.questionId,
        questionText: match.question.text,
        practiceId: match.question.practiceId,
        practiceName: match.question.practice.name,
        blockId: match.question.blockId,
        blockName: match.question.block.name,
        userAnswer: match.text,
        partnerAnswer: partnerAnswersMap[match.questionId].text
      }));
      
      matchingDesires.push(...regularMatches);
      
      // Обрабатываем ролевые вопросы (taker/giver)
      // Создаем словарь практик для сопоставления taker/giver вопросов
      const practiceQuestionsMap = {};
      
      // Заполняем словарь вопросами пользователя
      userAnswers.forEach(userAnswer => {
        const { practiceId, role } = userAnswer.question;
        if (role !== 'none') {
          if (!practiceQuestionsMap[practiceId]) {
            practiceQuestionsMap[practiceId] = {
              practiceName: userAnswer.question.practice.name,
              blockId: userAnswer.question.blockId,
              blockName: userAnswer.question.block.name,
              user: {},
              partner: {}
            };
          }
          practiceQuestionsMap[practiceId].user[role] = {
            questionId: userAnswer.questionId,
            questionText: userAnswer.question.text,
            answer: userAnswer.text
          };
        }
      });
      
      // Заполняем словарь вопросами партнера
      partnerAnswers.forEach(partnerAnswer => {
        const { practiceId, role } = partnerAnswer.question;
        if (role !== 'none') {
          if (!practiceQuestionsMap[practiceId]) {
            practiceQuestionsMap[practiceId] = {
              practiceName: partnerAnswer.question.practice.name,
              blockId: partnerAnswer.question.blockId,
              blockName: partnerAnswer.question.block.name,
              user: {},
              partner: {}
            };
          }
          practiceQuestionsMap[practiceId].partner[role] = {
            questionId: partnerAnswer.questionId,
            questionText: partnerAnswer.question.text,
            answer: partnerAnswer.text
          };
        }
      });
      
      // Находим совпадения для ролевых вопросов
      Object.entries(practiceQuestionsMap).forEach(([practiceId, practice]) => {
        // Проверяем совпадение: пользователь - giver, партнер - taker
        if (
          practice.user.giver && 
          practice.partner.taker && 
          (practice.user.giver.answer === 'yes' || practice.user.giver.answer === 'maybe') && 
          (practice.partner.taker.answer === 'yes' || practice.partner.taker.answer === 'maybe')
        ) {
          matchingDesires.push({
            type: 'role',
            practiceId: parseInt(practiceId),
            practiceName: practice.practiceName,
            blockId: practice.blockId,
            blockName: practice.blockName,
            userRole: 'giver',
            partnerRole: 'taker',
            userQuestionId: practice.user.giver.questionId,
            userQuestionText: practice.user.giver.questionText,
            userAnswer: practice.user.giver.answer,
            partnerQuestionId: practice.partner.taker.questionId,
            partnerQuestionText: practice.partner.taker.questionText,
            partnerAnswer: practice.partner.taker.answer
          });
        }
        
        // Проверяем совпадение: пользователь - taker, партнер - giver
        if (
          practice.user.taker && 
          practice.partner.giver && 
          (practice.user.taker.answer === 'yes' || practice.user.taker.answer === 'maybe') && 
          (practice.partner.giver.answer === 'yes' || practice.partner.giver.answer === 'maybe')
        ) {
          matchingDesires.push({
            type: 'role',
            practiceId: parseInt(practiceId),
            practiceName: practice.practiceName,
            blockId: practice.blockId,
            blockName: practice.blockName,
            userRole: 'taker',
            partnerRole: 'giver',
            userQuestionId: practice.user.taker.questionId,
            userQuestionText: practice.user.taker.questionText,
            userAnswer: practice.user.taker.answer,
            partnerQuestionId: practice.partner.giver.questionId,
            partnerQuestionText: practice.partner.giver.questionText,
            partnerAnswer: practice.partner.giver.answer
          });
        }
      });
      
      // Группируем совпадения по блокам для удобства отображения
      const matchingDesiresByBlock = {};
      matchingDesires.forEach(match => {
        if (!matchingDesiresByBlock[match.blockId]) {
          matchingDesiresByBlock[match.blockId] = {
            blockId: match.blockId,
            blockName: match.blockName,
            matches: []
          };
        }
        matchingDesiresByBlock[match.blockId].matches.push(match);
      });
      
      return res.status(200).json({
        success: true,
        matchingDesires: Object.values(matchingDesiresByBlock)
      });
    } catch (error) {
      console.error('Error getting matching desires:', error);
      return res.status(500).json({ error: 'Failed to get matching desires' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 