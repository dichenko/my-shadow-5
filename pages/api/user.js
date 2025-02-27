import prisma from '../../lib/prisma'
import { serialize } from 'cookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const userData = req.body
    
    if (!userData || !userData.id) {
      return res.status(400).json({ error: 'Invalid user data' })
    }
    
    // Проверяем, существует ли пользователь с таким Telegram ID
    const existingUser = await prisma.telegramUser.findUnique({
      where: {
        tgId: userData.id
      }
    })
    
    let user;
    
    if (existingUser) {
      // Обновляем существующего пользователя
      user = await prisma.telegramUser.update({
        where: {
          id: existingUser.id
        },
        data: {
          lastVisit: new Date(),
          visitCount: existingUser.visitCount + 1
        }
      })
    } else {
      // Создаем нового пользователя
      user = await prisma.telegramUser.create({
        data: {
          tgId: userData.id,
          firstVisit: new Date(),
          lastVisit: new Date(),
          visitCount: 1
        }
      })
    }
    
    // Устанавливаем cookie с ID пользователя
    const cookie = serialize('userId', String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      sameSite: 'strict',
      path: '/'
    })
    
    res.setHeader('Set-Cookie', cookie)
    
    return res.status(existingUser ? 200 : 201).json(user)
  } catch (error) {
    console.error('Error saving user data:', error)
    return res.status(500).json({ error: 'Failed to save user data', details: error.message })
  }
} 