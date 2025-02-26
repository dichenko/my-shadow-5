import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Получаем учетные данные из переменных окружения
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('Ошибка: отсутствуют учетные данные администратора в переменных окружения');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Проверяем учетные данные
  if (username === adminUsername && password === adminPassword) {
    // Создаем JWT или другой токен для сессии
    const token = Buffer.from(`${username}:${new Date().getTime()}`).toString('base64');
    
    // Устанавливаем cookie с токеном
    res.setHeader('Set-Cookie', serialize('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 день
      path: '/',
      sameSite: 'strict'
    }));

    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
} 