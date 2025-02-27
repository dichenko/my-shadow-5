import prisma from '../../lib/prisma'
import { serialize } from 'cookie'

export default async function handler(req, res) {
  // Устанавливаем заголовки CORS для всех запросов
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обработка OPTIONS запроса (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const userData = req.body
    
    if (!userData || !userData.id) {
      return res.status(400).json({ error: 'Данные пользователя отсутствуют или не содержат ID' })
    }
    
    console.log('Получены данные пользователя:', userData);
    
    // Проверяем, существует ли пользователь с таким Telegram ID
    const existingUser = await prisma.telegramUser.findUnique({
      where: {
        tgId: userData.id
      }
    })
    
    let user;
    
    if (existingUser) {
      console.log('Найден существующий пользователь:', existingUser);
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
      console.log('Создаем нового пользователя с tgId:', userData.id);
      try {
        // Создаем нового пользователя
        user = await prisma.telegramUser.create({
          data: {
            tgId: userData.id,
            firstVisit: new Date(),
            lastVisit: new Date(),
            visitCount: 1
          }
        })
        console.log('Создан новый пользователь:', user);
      } catch (createError) {
        console.error('Ошибка при создании пользователя:', createError);
        return res.status(500).json({ 
          error: 'Не удалось создать пользователя', 
          details: createError.message,
          data: userData
        });
      }
    }
    
    // Устанавливаем cookie с ID пользователя
    try {
      const cookie = serialize('userId', String(user.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        sameSite: 'lax',
        path: '/'
      })
      
      res.setHeader('Set-Cookie', cookie)
      console.log('Установлен cookie userId:', user.id);
    } catch (cookieError) {
      console.error('Ошибка при установке cookie:', cookieError);
      // Продолжаем выполнение, даже если cookie не установлен
    }
    
    return res.status(existingUser ? 200 : 201).json({
      ...user,
      _message: existingUser ? 'Пользователь обновлен' : 'Пользователь создан'
    })
  } catch (error) {
    console.error('Ошибка при сохранении данных пользователя:', error)
    return res.status(500).json({ 
      error: 'Не удалось сохранить данные пользователя', 
      details: error.message 
    })
  }
} 