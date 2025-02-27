import { serialize } from 'cookie';

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Создаем cookie с истекшим сроком действия
    const cookie = serialize('adminToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: -1, // Истекший срок действия
      path: '/',
    });

    // Устанавливаем cookie
    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ success: true, message: 'Успешный выход' });
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 