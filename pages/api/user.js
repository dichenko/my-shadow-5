import prisma from '../../lib/prisma'

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
    
    if (existingUser) {
      // Обновляем существующего пользователя
      const updatedUser = await prisma.telegramUser.update({
        where: {
          id: existingUser.id
        },
        data: {
          lastVisit: new Date(),
          visitCount: existingUser.visitCount + 1
        }
      })
      
      return res.status(200).json(updatedUser)
    } else {
      // Создаем нового пользователя
      const newUser = await prisma.telegramUser.create({
        data: {
          tgId: userData.id,
          firstVisit: new Date(),
          lastVisit: new Date(),
          visitCount: 1
        }
      })
      
      return res.status(201).json(newUser)
    }
  } catch (error) {
    console.error('Error saving user data:', error)
    return res.status(500).json({ error: 'Failed to save user data', details: error.message })
  }
} 