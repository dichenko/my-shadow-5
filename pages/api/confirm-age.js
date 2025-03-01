import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  // Проверяем метод запроса
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    
    console.log('Получен запрос на подтверждение возраста для пользователя:', userId);

    if (!userId) {
      console.log('ID пользователя не предоставлен');
      return res.status(200).json({ 
        success: true,
        message: 'Возраст подтвержден без сохранения (ID не предоставлен)'
      });
    }

    // Устанавливаем дату рождения, которая соответствует 18+ (18 лет назад от текущей даты)
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    console.log('Устанавливаем дату рождения:', eighteenYearsAgo);

    try {
      // Получаем текущие данные пользователя
      const currentUser = await prisma.telegramUser.findUnique({
        where: {
          id: parseInt(userId, 10)
        }
      });

      if (!currentUser) {
        console.log('Пользователь не найден в базе данных');
        return res.status(200).json({
          success: true,
          message: 'Пользователь не найден, возраст подтвержден без сохранения'
        });
      }
      
      console.log('Текущие данные пользователя:', {
        id: currentUser.id,
        visitCount: currentUser.visitCount,
        birthdate: currentUser.birthdate
      });

      // Обновляем пользователя в базе данных
      const user = await prisma.telegramUser.update({
        where: {
          id: parseInt(userId, 10)
        },
        data: {
          birthdate: eighteenYearsAgo,
          // Устанавливаем счетчик посещений минимум 2, чтобы пропускать проверку в будущем
          visitCount: Math.max(currentUser.visitCount, 2)
        }
      });
      
      console.log('Пользователь успешно обновлен:', {
        id: user.id,
        visitCount: user.visitCount,
        birthdate: user.birthdate
      });

      return res.status(200).json({
        success: true,
        message: 'Возраст успешно подтвержден',
        user
      });
    } catch (dbError) {
      console.error('Ошибка при обновлении данных пользователя:', dbError);
      
      // Возвращаем успешный ответ, даже если не удалось обновить базу данных
      return res.status(200).json({
        success: true,
        message: 'Возраст подтвержден без сохранения в базе данных',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Ошибка при подтверждении возраста:', error);
    
    // Возвращаем успешный ответ, даже если произошла ошибка
    return res.status(200).json({
      success: true,
      message: 'Возраст подтвержден, но произошла ошибка при обработке',
      error: error.message
    });
  }
} 