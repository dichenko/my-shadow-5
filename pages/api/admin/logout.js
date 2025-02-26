import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Удаляем cookie с токеном
  res.setHeader('Set-Cookie', serialize('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: -1, // Удаляем cookie
    path: '/',
    sameSite: 'strict'
  }));

  return res.status(200).json({ success: true });
} 