import prisma from '../../lib/prisma';
import { checkAuth } from '../../utils/auth';
import { generateUniquePairCode } from '../../utils/pairCode';

export default async function handler(req, res) {
  // Проверяем аутентификацию
  const user = await checkAuth(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { pairCode } = req.body;

      if (!pairCode) {
        return res.status(400).json({ error: 'Pair code is required' });
      }

      // Получаем текущего пользователя
      const currentUser = await prisma.telegramUser.findUnique({
        where: { id: user.id }
      });

      // Проверяем, что у пользователя нет партнера
      if (currentUser.partnerId) {
        return res.status(400).json({ error: 'You already have a partner' });
      }

      // Находим партнера по коду
      const partner = await prisma.telegramUser.findUnique({
        where: { pairCode }
      });

      if (!partner) {
        return res.status(404).json({ error: 'Partner not found with this code' });
      }

      // Проверяем, что партнер не имеет другого партнера
      if (partner.partnerId) {
        return res.status(400).json({ error: 'This partner already has another partner' });
      }

      // Проверяем, что пользователь не пытается создать пару с самим собой
      if (partner.id === currentUser.id) {
        return res.status(400).json({ error: 'You cannot create a pair with yourself' });
      }

      // Создаем пару в транзакции
      await prisma.$transaction([
        // Обновляем текущего пользователя
        prisma.telegramUser.update({
          where: { id: currentUser.id },
          data: {
            partnerId: partner.id,
            pairCode: null // Удаляем код, так как он больше не нужен
          }
        }),
        // Обновляем партнера
        prisma.telegramUser.update({
          where: { id: partner.id },
          data: {
            partnerId: currentUser.id,
            pairCode: null // Удаляем код партнера
          }
        })
      ]);

      // Отправляем уведомление партнеру через Telegram
      try {
        const notificationMessage = `У вас появился новый партнер! Теперь вы можете увидеть совпадающие желания в разделе "Моя пара".`;
        
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-telegram-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.cookie // Передаем куки для аутентификации
          },
          body: JSON.stringify({
            tgId: partner.tgId,
            message: notificationMessage
          })
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Продолжаем выполнение, даже если уведомление не отправлено
      }

      return res.status(200).json({ success: true, message: 'Pair created successfully' });
    } catch (error) {
      console.error('Error creating pair:', error);
      return res.status(500).json({ error: 'Failed to create pair' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 