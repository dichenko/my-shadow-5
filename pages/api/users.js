import prisma from '../../lib/prisma';
import { parse } from 'cookie';
import { checkAdminAuth } from '../../utils/auth';
import { setCorsHeaders, handleCorsOptions } from '../../utils/cors';

// Простая проверка аутентификации на основе cookie
async function checkAuth(req) {
  try {
    // Получаем cookie из запроса
    const cookies = parse(req.headers.cookie || '');
    const adminToken = cookies.adminToken;
    
    // Проверяем токен администратора
    return adminToken === process.env.ADMIN_PASSWORD;
  } catch (error) {
    console.error('Ошибка при проверке аутентификации:', error);
    return false;
  }
}

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки и обрабатываем OPTIONS запросы
  if (handleCorsOptions(req, res)) {
    return;
  }

  // Проверка аутентификации с использованием общей функции
  const isAuthenticated = await checkAdminAuth(req);
  if (!isAuthenticated) {
    console.log('API users: Не авторизован');
    return res.status(401).json({ 
      message: 'Unauthorized',
      error: 'Требуется авторизация администратора'
    });
  }

  // Обработка GET запроса для получения списка пользователей
  if (req.method === 'GET') {
    try {
      console.log('API users: Получение списка пользователей');
      const users = await prisma.telegramUser.findMany({
        orderBy: {
          id: 'asc',
        },
      });
      
      return res.status(200).json(users);
    } catch (error) {
      console.error('Ошибка при получении пользователей:', error);
      return res.status(500).json({ 
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  }
  
  // Если метод не поддерживается
  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ message: 'Method not allowed' });
} 