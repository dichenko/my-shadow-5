// API-эндпоинт для получения фотографии пользователя через Telegram Bot API
// Для работы этого эндпоинта необходимо указать TELEGRAM_BOT_TOKEN в переменных окружения

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing user ID' });
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.error('Отсутствует TELEGRAM_BOT_TOKEN в переменных окружения');
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    // Получаем информацию о фотографии пользователя через Telegram Bot API
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${userId}&limit=1`);
    const data = await response.json();

    if (!data.ok || !data.result || !data.result.photos || data.result.photos.length === 0) {
      console.log('Фотография пользователя не найдена:', data);
      return res.status(404).json({ error: 'User photo not found' });
    }

    // Получаем информацию о файле фотографии
    const fileId = data.result.photos[0][0].file_id;
    const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileData = await fileResponse.json();

    if (!fileData.ok || !fileData.result || !fileData.result.file_path) {
      console.log('Информация о файле фотографии не найдена:', fileData);
      return res.status(404).json({ error: 'File info not found' });
    }

    // Формируем URL фотографии
    const photoUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
    
    // Возвращаем URL фотографии
    res.status(200).json({ photoUrl });
  } catch (error) {
    console.error('Ошибка при получении фотографии пользователя:', error);
    res.status(500).json({ error: 'Failed to get user photo', details: error.message });
  }
} 