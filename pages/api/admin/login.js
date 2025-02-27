import { serialize } from 'cookie';

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Логируем значения для отладки
    console.log('Попытка входа в админ-панель:');
    console.log('Введенные данные:', { username, password });
    console.log('Ожидаемые данные:', { 
      username: process.env.ADMIN_USERNAME, 
      password: process.env.ADMIN_PASSWORD 
    });

    // Проверяем учетные данные администратора
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      console.log('Неверные учетные данные');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Учетные данные верны, создаем cookie');
    
    // Создаем cookie с токеном администратора
    const cookie = serialize('adminToken', process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Изменено с 'strict' на 'lax' для лучшей совместимости
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    });

    // Устанавливаем cookie
    res.setHeader('Set-Cookie', cookie);
    console.log('Cookie установлен:', cookie);

    return res.status(200).json({ success: true, message: 'Успешная аутентификация' });
  } catch (error) {
    console.error('Ошибка при аутентификации:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 