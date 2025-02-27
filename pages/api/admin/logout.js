import { serialize } from 'cookie';
import { setCorsHeaders, handleCorsOptions } from '../../../utils/cors';

export default async function handler(req, res) {
  console.log('Получен запрос на выход администратора');

  // Устанавливаем CORS заголовки и обрабатываем OPTIONS запросы
  if (handleCorsOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    console.log(`Метод ${req.method} не поддерживается`);
    return res.status(405).json({ success: false, message: 'Метод не поддерживается' });
  }

  try {
    console.log('Выход из админ-панели');
    
    // Создаем cookie с истекшим сроком действия
    const cookie = serialize('adminToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1, // Устанавливаем отрицательное значение для удаления cookie
      path: '/',
    });

    // Устанавливаем cookie
    res.setHeader('Set-Cookie', cookie);
    console.log('Cookie удален');

    return res.status(200).json({ 
      success: true, 
      message: 'Успешный выход',
      debug: {
        cookieCleared: true,
        time: new Date().toISOString(),
        origin: req.headers.origin || 'не указан'
      }
    });
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Внутренняя ошибка сервера', 
      error: error.message 
    });
  }
} 