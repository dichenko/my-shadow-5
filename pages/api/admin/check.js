import { parse } from 'cookie';
import { setCorsHeaders, handleCorsOptions } from '../../../utils/cors';

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки и обрабатываем OPTIONS запросы
  if (handleCorsOptions(req, res)) {
    return;
  }

  // Разрешаем только GET запросы
  if (req.method !== 'GET') {
    console.log(`Метод ${req.method} не поддерживается`);
    return res.status(405).json({ success: false, message: 'Метод не поддерживается' });
  }

  try {
    console.log('Проверка авторизации администратора');
    
    // Получаем cookie из запроса
    const cookieHeader = req.headers.cookie || '';
    console.log('Заголовок Cookie:', cookieHeader);
    
    const cookies = parse(cookieHeader);
    console.log('Полученные cookies:', Object.keys(cookies));
    
    const adminToken = cookies.adminToken;
    console.log('Токен администратора:', adminToken ? 'найден' : 'отсутствует');
    
    if (adminToken) {
      console.log('Длина токена:', adminToken.length);
      console.log('Длина ожидаемого пароля:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0);
    }
    
    // Проверяем токен администратора
    const isAuthenticated = adminToken === process.env.ADMIN_PASSWORD;
    console.log('Результат проверки:', isAuthenticated);
    
    if (isAuthenticated) {
      return res.status(200).json({ 
        authenticated: true, 
        success: true,
        debug: {
          time: new Date().toISOString(),
          origin: req.headers.origin || 'не указан'
        }
      });
    }
    
    return res.status(401).json({ 
      authenticated: false, 
      success: false,
      message: 'Не авторизован'
    });
  } catch (error) {
    console.error('Ошибка при проверке аутентификации:', error);
    return res.status(500).json({ 
      message: 'Внутренняя ошибка сервера',
      error: error.message,
      success: false
    });
  }
} 