import { serialize } from 'cookie';

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Проверяем учетные данные администратора
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

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

    return res.status(200).json({ success: true, message: 'Успешная аутентификация' });
  } catch (error) {
    console.error('Ошибка при аутентификации:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 