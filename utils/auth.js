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
    
    // Обновляем дату последнего посещения и счетчик посещений
    await prisma.telegramUser.update({
      where: { id: user.id },
      data: {
        lastVisit: new Date(),
        visitCount: { increment: 1 }
      }
    });
    
    return user;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации:', error);
    return null;
  }
}

/**
 * Проверяет аутентификацию администратора на основе cookie
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
    
    const adminToken = cookies.adminToken;
    
    if (!adminToken) {
      console.log('Токен администратора отсутствует');
      return false;
    }
    
    console.log('Токен администратора найден, длина:', adminToken.length);
    console.log('Ожидаемый пароль, длина:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0);
    
    // Проверяем токен администратора
    const isValid = adminToken === process.env.ADMIN_PASSWORD;
    console.log('Результат проверки токена:', isValid);
    
    return isValid;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации администратора:', error);
    return false;
  }
} 