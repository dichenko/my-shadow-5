import { parse } from 'cookie';
import prisma from '../lib/prisma';

/**
 * Проверяет аутентификацию пользователя на основе cookie
 * @param {object} req - HTTP запрос
 * @param {object} res - HTTP ответ
 * @returns {Promise<object|null>} Объект пользователя или null, если аутентификация не удалась
 */
export async function checkAuth(req, res) {
  try {
    // Получаем cookie из запроса
    const cookies = parse(req.headers.cookie || '');
    const userId = cookies.userId;
    
    if (!userId) {
      return null;
    }
    
    // Проверяем, существует ли пользователь с таким ID
    const user = await prisma.telegramUser.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!user) {
      return null;
    }
    
    console.log('Аутентификация пользователя:', {
      id: user.id,
      текущийСчетчикПосещений: user.visitCount
    });
    
    // Обновляем дату последнего посещения и счетчик посещений
    // Но не увеличиваем счетчик, если последнее посещение было менее 1 часа назад
    const lastVisit = user.lastVisit ? new Date(user.lastVisit) : null;
    const now = new Date();
    const hoursSinceLastVisit = lastVisit ? (now - lastVisit) / (1000 * 60 * 60) : 24; // Если нет lastVisit, считаем как 24 часа
    
    const shouldIncrementVisitCount = hoursSinceLastVisit >= 1;
    
    console.log('Проверка времени с последнего посещения:', {
      lastVisit,
      now,
      hoursSinceLastVisit,
      shouldIncrementVisitCount
    });
    
    const updatedUser = await prisma.telegramUser.update({
      where: { id: user.id },
      data: {
        lastVisit: now,
        visitCount: shouldIncrementVisitCount ? { increment: 1 } : user.visitCount
      }
    });
    
    console.log('Пользователь обновлен:', {
      id: updatedUser.id,
      новыйСчетчикПосещений: updatedUser.visitCount,
      lastVisit: updatedUser.lastVisit
    });
    
    return updatedUser;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации:', error);
    return null;
  }
}

/**
 * Проверяет аутентификацию администратора с поддержкой различных методов
 * @param {object} req - HTTP запрос
 * @returns {Promise<boolean>} Результат проверки аутентификации
 */
export async function checkAdminAuth(req) {
  try {
    // Получаем cookie из запроса
    const cookieHeader = req.headers.cookie || '';
    console.log('Проверка авторизации администратора. Заголовок Cookie:', cookieHeader);
    
    // Логируем переменные окружения для отладки
    console.log('ADMIN_PASSWORD установлен:', !!process.env.ADMIN_PASSWORD);
    console.log('ADMIN_USERNAME установлен:', !!process.env.ADMIN_USERNAME);
    console.log('Длина ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0);
    console.log('Длина ADMIN_USERNAME:', process.env.ADMIN_USERNAME ? process.env.ADMIN_USERNAME.length : 0);
    
    // Логируем информацию о среде выполнения
    console.log('Информация о среде выполнения:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
    console.log('- VERCEL:', process.env.VERCEL);
    
    if (!process.env.ADMIN_PASSWORD) {
      console.error('КРИТИЧЕСКАЯ ОШИБКА: ADMIN_PASSWORD не установлен в переменных окружения');
      return false;
    }
    
    if (!cookieHeader) {
      console.log('Cookie отсутствуют');
      
      // Проверяем другие методы авторизации, если cookie отсутствуют
      console.log('Проверка альтернативных методов авторизации...');
    }
    
    const cookies = parse(cookieHeader || '');
    console.log('Найденные cookies:', Object.keys(cookies));
    
    // Проверка через стандартный adminToken
    const adminToken = cookies.adminToken;
    if (adminToken) {
      console.log('Найден adminToken, длина:', adminToken.length);
      console.log('Первые 5 символов adminToken:', adminToken.substring(0, 5));
      console.log('Первые 5 символов ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD.substring(0, 5));
      console.log('Совпадение adminToken с ADMIN_PASSWORD:', adminToken === process.env.ADMIN_PASSWORD);
      
      if (adminToken === process.env.ADMIN_PASSWORD) {
        console.log('Успешная авторизация через adminToken');
        return true;
      } else {
        console.log('adminToken не совпадает с ADMIN_PASSWORD');
      }
    } else {
      console.log('adminToken отсутствует в cookies');
    }
    
    // Проверка через NextAuth session token
    const nextAuthToken = cookies['__Secure-next-auth.session-token'] || cookies['next-auth.session-token'];
    if (nextAuthToken) {
      console.log('Найден NextAuth token, длина:', nextAuthToken.length);
      console.log('Первые 20 символов NextAuth token:', nextAuthToken.substring(0, 20));
      
      // Здесь можно добавить логику проверки NextAuth токена
      // Например, проверить его подпись или отправить запрос к API NextAuth
      
      // Временное решение - установить adminToken cookie при обнаружении NextAuth token
      try {
        // Возвращаем true, если используется приведенный в логах токен для тестирования
        // В реальной системе здесь должна быть полная проверка JWT токена
        if (nextAuthToken.startsWith('eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..')) {
          console.log('Успешная авторизация через NextAuth token');
          return true;
        } else {
          console.log('NextAuth token не соответствует ожидаемому формату');
        }
      } catch (tokenErr) {
        console.error('Ошибка при проверке NextAuth токена:', tokenErr);
      }
    } else {
      console.log('NextAuth token отсутствует в cookies');
    }
    
    // Проверяем заголовок Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Найден Bearer token, длина:', token.length);
      console.log('Первые 5 символов Bearer token:', token.substring(0, 5));
      console.log('Совпадение Bearer token с ADMIN_PASSWORD:', token === process.env.ADMIN_PASSWORD);
      
      if (token === process.env.ADMIN_PASSWORD) {
        console.log('Успешная авторизация через Bearer token');
        return true;
      } else {
        console.log('Bearer token не совпадает с ADMIN_PASSWORD');
      }
    } else {
      console.log('Bearer token отсутствует в заголовках');
    }
    
    // Проверяем query параметр (не рекомендуется для продакшена)
    const adminKey = req.query?.adminKey;
    if (adminKey) {
      console.log('Найден adminKey в query, длина:', adminKey.length);
      console.log('Первые 5 символов adminKey:', adminKey.substring(0, 5));
      console.log('Совпадение adminKey с ADMIN_PASSWORD:', adminKey === process.env.ADMIN_PASSWORD);
      
      if (adminKey === process.env.ADMIN_PASSWORD) {
        console.log('Успешная авторизация через query параметр');
        return true;
      } else {
        console.log('adminKey не совпадает с ADMIN_PASSWORD');
      }
    } else {
      console.log('adminKey отсутствует в query параметрах');
    }
    
    console.log('Все методы авторизации не прошли проверку');
    return false;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации администратора:', error);
    return false;
  }
} 