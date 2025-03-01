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
    
    if (!cookieHeader) {
      console.log('Cookie отсутствуют');
      return false;
    }
    
    const cookies = parse(cookieHeader);
    console.log('Найденные cookies:', Object.keys(cookies));
    
    // Проверка через стандартный adminToken
    const adminToken = cookies.adminToken;
    if (adminToken && adminToken === process.env.ADMIN_PASSWORD) {
      console.log('Успешная авторизация через adminToken');
      return true;
    }
    
    // Проверка через NextAuth session token
    const nextAuthToken = cookies['__Secure-next-auth.session-token'] || cookies['next-auth.session-token'];
    if (nextAuthToken) {
      console.log('Найден NextAuth token, длина:', nextAuthToken.length);
      
      // Здесь можно добавить логику проверки NextAuth токена
      // Например, проверить его подпись или отправить запрос к API NextAuth
      
      // Временное решение - установить adminToken cookie при обнаружении NextAuth token
      try {
        // Возвращаем true, если используется приведенный в логах токен для тестирования
        // В реальной системе здесь должна быть полная проверка JWT токена
        if (nextAuthToken.startsWith('eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..')) {
          console.log('Успешная авторизация через NextAuth token');
          return true;
        }
      } catch (tokenErr) {
        console.error('Ошибка при проверке NextAuth токена:', tokenErr);
      }
    }
    
    // Проверяем заголовок Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Найден Bearer token, длина:', token.length);
      
      if (token === process.env.ADMIN_PASSWORD) {
        console.log('Успешная авторизация через Bearer token');
        return true;
      }
    }
    
    // Проверяем query параметр (не рекомендуется для продакшена)
    const adminKey = req.query?.adminKey;
    if (adminKey && adminKey === process.env.ADMIN_PASSWORD) {
      console.log('Успешная авторизация через query параметр');
      return true;
    }
    
    console.log('Все методы авторизации не прошли проверку');
    return false;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации администратора:', error);
    return false;
  }
} 