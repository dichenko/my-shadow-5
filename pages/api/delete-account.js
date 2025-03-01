import prisma from '../../lib/prisma';
import { checkAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Проверяем аутентификацию
  const user = await checkAuth(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Обрабатываем только DELETE запросы
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Получаем текущего пользователя с информацией о партнере
    const currentUser = await prisma.telegramUser.findUnique({
      where: { id: user.id },
      include: { partner: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем, есть ли у пользователя партнер
    if (currentUser.partnerId) {
      const partnerId = currentUser.partnerId;
      const partnerTgId = currentUser.partner.tgId;

      // Отправляем уведомление партнеру через Telegram
      try {
        const notificationMessage = `Ваш партнер удалил свой профиль из MyShadow. Ваша связь была разорвана.`;
        
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

      // Обновляем партнера, удаляя связь
      await prisma.telegramUser.update({
        where: { id: partnerId },
        data: {
          partnerId: null
        }
      });
    }

    // Удаляем все ответы пользователя
    await prisma.answer.deleteMany({
      where: { userId: currentUser.id }
    });

    // Удаляем пользователя
    await prisma.telegramUser.delete({
      where: { id: currentUser.id }
    });

    return res.status(200).json({
      success: true,
      message: 'Аккаунт успешно удален'
    });
  } catch (error) {
    console.error('Ошибка при удалении аккаунта:', error);
    return res.status(500).json({ 
      error: 'Не удалось удалить аккаунт',
      details: error.message
    });
  }
} 