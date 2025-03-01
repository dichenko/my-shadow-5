import { serialize } from 'cookie';
import { setCorsHeaders, handleCorsOptions } from '../../../utils/cors';

export default async function handler(req, res) {
  console.log('Получен запрос на вход администратора');

  // Устанавливаем CORS заголовки и обрабатываем OPTIONS запросы
  if (handleCorsOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    console.log(`Метод ${req.method} не поддерживается`);
    return res.status(405).json({ success: false, message: 'Метод не поддерживается' });
  }

  try {
    console.log('Тело запроса:', req.body);
    const { username, password } = req.body;
    
    console.log(`Получены учетные данные: username=${username ? 'предоставлен' : 'отсутствует'}, password=${password ? 'предоставлен' : 'отсутствует'}`);
    console.log(`Ожидаемые учетные данные: username=${process.env.ADMIN_USERNAME ? 'настроен' : 'не настроен'}, password=${process.env.ADMIN_PASSWORD ? 'настроен' : 'не настроен'}`);
    
    // Добавляем дополнительное логирование для отладки
    console.log('ADMIN_USERNAME установлен:', !!process.env.ADMIN_USERNAME);
    console.log('ADMIN_PASSWORD установлен:', !!process.env.ADMIN_PASSWORD);
    console.log('Длина ADMIN_USERNAME:', process.env.ADMIN_USERNAME ? process.env.ADMIN_USERNAME.length : 0);
    console.log('Длина ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0);
    
    if (!username || !password) {
      console.log('Отсутствует логин или пароль');
      return res.status(400).json({ success: false, message: 'Требуется логин и пароль' });
    }
    
    // Проверяем учетные данные администратора
    const isUsernameValid = username === process.env.ADMIN_USERNAME;
    const isPasswordValid = password === process.env.ADMIN_PASSWORD;
    
    console.log(`Результат проверки: username=${isUsernameValid}, password=${isPasswordValid}`);
    
    if (!isUsernameValid || !isPasswordValid) {
      console.log('Неверные учетные данные');
      return res.status(401).json({ success: false, message: 'Неверные учетные данные' });
    }

    // Создаем cookie с токеном администратора
    console.log('Создаем cookie с токеном, длина:', process.env.ADMIN_PASSWORD.length);
    const tokenCookie = serialize('adminToken', process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });
    
    console.log('Устанавливаем cookie:', tokenCookie.slice(0, 20) + '...');
    res.setHeader('Set-Cookie', tokenCookie);
    
    // Возвращаем успешный ответ
    console.log('Аутентификация успешна');
    return res.status(200).json({ 
      success: true, 
      message: 'Аутентификация успешна',
      debug: {
        cookieSet: true,
        tokenLength: process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0,
        time: new Date().toISOString(),
        origin: req.headers.origin || 'не указан',
        env: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV,
          VERCEL: process.env.VERCEL
        }
      }
    });
  } catch (error) {
    console.error('Ошибка при аутентификации:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
} 