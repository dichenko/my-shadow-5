import prisma from '../../lib/prisma';
import { checkAuth } from '../../utils/auth';

export default async function handler(req, res) {
  // Проверяем аутентификацию для внутреннего использования
  // В реальном приложении здесь должна быть более строгая проверка
  const user = await checkAuth(req, res);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { tgId, message } = req.body;

      if (!tgId || !message) {
        return res.status(400).json({ error: 'tgId and message are required' });
      }

      // Проверяем, существует ли пользователь с таким tgId
      const targetUser = await prisma.telegramUser.findUnique({
        where: { tgId: parseInt(tgId) }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Отправляем сообщение через Telegram Bot API
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        return res.status(500).json({ error: 'Telegram bot token is not configured' });
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: tgId,
          text: message,
          parse_mode: 'HTML'
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        console.error('Telegram API error:', data);
        return res.status(500).json({ error: 'Failed to send Telegram message', details: data });
      }

      return res.status(200).json({ success: true, message: 'Notification sent successfully' });
    } catch (error) {
      console.error('Error sending notification:', error);
      return res.status(500).json({ error: 'Failed to send notification' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 