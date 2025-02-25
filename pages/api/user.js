import prisma from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const userData = req.body

    const user = await prisma.telegramUser.upsert({
      where: {
        tgId: userData.id
      },
      update: {
        lastVisit: new Date(),
        visitCount: {
          increment: 1
        }
      },
      create: {
        tgId: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        username: userData.username,
        languageCode: userData.language_code,
      }
    })

    res.status(200).json(user)
  } catch (error) {
    console.error('Error saving user:', error)
    res.status(500).json({ error: 'Failed to save user data' })
  }
} 