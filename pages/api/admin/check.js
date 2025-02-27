import { parse } from 'cookie';

export default async function handler(req, res) {
  // Разрешаем только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Получаем cookie из запроса
    const cookies = parse(req.headers.cookie || '');
    const adminToken = cookies.adminToken;
    
    // Проверяем токен администратора
    if (adminToken === process.env.ADMIN_PASSWORD) {
      return res.status(200).json({ authenticated: true });
    }
    
    return res.status(401).json({ authenticated: false });
  } catch (error) {
    console.error('Ошибка при проверке аутентификации:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 