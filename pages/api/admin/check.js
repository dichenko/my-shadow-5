import { parse } from 'cookie';

export default async function handler(req, res) {
  // Разрешаем только GET запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Логируем все заголовки для отладки
    console.log('Все заголовки запроса:', req.headers);
    
    // Получаем cookie из запроса
    const cookieHeader = req.headers.cookie || '';
    console.log('Заголовок Cookie:', cookieHeader);
    
    const cookies = parse(cookieHeader);
    console.log('Распарсенные cookies:', cookies);
    
    const adminToken = cookies.adminToken;
    
    // Логируем значения для отладки
    console.log('Проверка аутентификации администратора:');
    console.log('Cookie adminToken:', adminToken);
    console.log('ADMIN_PASSWORD из env:', process.env.ADMIN_PASSWORD);
    console.log('Совпадение:', adminToken === process.env.ADMIN_PASSWORD);
    
    // Проверяем токен администратора
    if (adminToken && adminToken === process.env.ADMIN_PASSWORD) {
      console.log('Аутентификация успешна');
      return res.status(200).json({ authenticated: true });
    }
    
    console.log('Аутентификация не удалась');
    return res.status(401).json({ authenticated: false, reason: adminToken ? 'invalid_token' : 'no_token' });
  } catch (error) {
    console.error('Ошибка при проверке аутентификации:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
} 