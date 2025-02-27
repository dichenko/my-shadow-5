import prisma from '../../lib/prisma';
import { generateUniquePairCode } from '../../utils/pairCode';
import { checkAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Проверяем аутентификацию
  const user = await checkAuth(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Получаем пользователя с актуальной информацией
      const currentUser = await prisma.telegramUser.findUnique({
        where: { id: user.id },
        include: {
          partner: true
        }
      });

      // Если у пользователя уже есть партнер, возвращаем информацию о паре
      if (currentUser.partnerId) {
        return res.status(200).json({
          hasPair: true,
          pairCode: null
        });
      }

      // Если у пользователя нет кода, генерируем новый
      if (!currentUser.pairCode) {
        const pairCode = await generateUniquePairCode(prisma);
        
        await prisma.telegramUser.update({
          where: { id: user.id },
          data: { pairCode }
        });

        return res.status(200).json({
          hasPair: false,
          pairCode
        });
      }

      // Возвращаем существующий код
      return res.status(200).json({
        hasPair: false,
        pairCode: currentUser.pairCode
      });
    } catch (error) {
      console.error('Error getting pair code:', error);
      return res.status(500).json({ error: 'Failed to get pair code' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 