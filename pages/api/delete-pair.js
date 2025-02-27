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
      // Получаем текущего пользователя с информацией о партнере
      const currentUser = await prisma.telegramUser.findUnique({
        where: { id: user.id },
        include: { partner: true }
      });

      // Проверяем, что у пользователя есть партнер
      if (!currentUser.partnerId) {
        return res.status(400).json({ error: 'You do not have a partner to delete' });
      }

      const partnerId = currentUser.partnerId;
      const partnerTgId = currentUser.partner.tgId;

      // Генерируем новые коды для обоих пользователей
      const newCodeForCurrentUser = await generateUniquePairCode(prisma);
      const newCodeForPartner = await generateUniquePairCode(prisma);

      // Удаляем связь в транзакции
      await prisma.$transaction([
        // Обновляем текущего пользователя
        prisma.telegramUser.update({
          where: { id: currentUser.id },
          data: {
            partnerId: null,
            pairCode: newCodeForCurrentUser
          }
        }),
        // Обновляем партнера
        prisma.telegramUser.update({
          where: { id: partnerId },
          data: {
            partnerId: null,
            pairCode: newCodeForPartner
          }
        })
      ]);

      // Отправляем уведомление партнеру через Telegram
      try {
        const notificationMessage = `Ваш партнер удалил связь. Теперь вы можете создать новую пару, используя свой новый код.`;
        
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/send-telegram-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.cookie // Передаем куки для аутентификации
          },
          body: JSON.stringify({
            tgId: partnerTgId,
            message: notificationMessage
          })
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Продолжаем выполнение, даже если уведомление не отправлено
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Pair deleted successfully',
        newPairCode: newCodeForCurrentUser
      });
    } catch (error) {
      console.error('Error deleting pair:', error);
      return res.status(500).json({ error: 'Failed to delete pair' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 