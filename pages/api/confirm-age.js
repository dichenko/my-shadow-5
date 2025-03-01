import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Устанавливаем флаг isAdult для пользователя
    // Задаем дату рождения, которая соответствует 18+ (18 лет назад от текущей даты)
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

    // Обновляем пользователя в базе данных
    const user = await prisma.telegramUser.update({
      where: {
        id: parseInt(userId, 10)
      },
      data: {
        birthdate: eighteenYearsAgo
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Возраст успешно подтвержден',
      user
    });
  } catch (error) {
    console.error('Ошибка при подтверждении возраста:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при подтверждении возраста',
      error: error.message
    });
  }
} 