import { db } from '../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Получаем существующего пользователя по ID
    const userSnapshot = await db.collection('users').where('id', '==', parseInt(userId)).get();
    
    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Увеличиваем счетчик посещений
    const currentVisitCount = userData.visitCount || 0;
    const newVisitCount = currentVisitCount + 1;
    
    // Обновляем данные пользователя в базе данных
    await userDoc.ref.update({
      visitCount: newVisitCount,
      lastVisit: new Date().toISOString()
    });
    
    return res.status(200).json({ 
      success: true,
      userId,
      visitCount: newVisitCount
    });
    
  } catch (error) {
    console.error('Error incrementing visit count:', error);
    return res.status(500).json({ error: 'Failed to increment visit count' });
  }
} 