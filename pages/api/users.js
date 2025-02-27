import { PrismaClient } from '@prisma/client';
import { parse } from 'cookie';

const prisma = new PrismaClient();

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
  // Проверка аутентификации
  const isAuthenticated = await checkAuth(req);
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Обработка GET запроса для получения списка пользователей
  if (req.method === 'GET') {
    try {
      const users = await prisma.telegramUser.findMany({
        orderBy: {
          id: 'asc',
        },
      });
      
      return res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Failed to fetch users' });
    }
  }
  
  // Если метод не поддерживается
  return res.status(405).json({ message: 'Method not allowed' });
} 