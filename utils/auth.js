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
    const cookies = parse(req.headers.cookie || '');
    const adminToken = cookies.adminToken;
    
    // Проверяем токен администратора
    return adminToken === process.env.ADMIN_PASSWORD;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации администратора:', error);
    return false;
  }
} 