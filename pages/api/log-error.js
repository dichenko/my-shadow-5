export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const errorData = req.body;
      
      // Логируем ошибку в консоль сервера (будет видна в логах Vercel)
      console.error('CLIENT ERROR:', JSON.stringify(errorData, null, 2));
      
      // Здесь можно добавить сохранение ошибки в базу данных или отправку уведомления
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error logging client error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 