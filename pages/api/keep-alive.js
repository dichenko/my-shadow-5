import keepDatabaseAlive from '../../utils/keep-alive';

export default async function handler(req, res) {
  // Обрабатываем только GET запросы
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const result = await keepDatabaseAlive();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in keep-alive endpoint:', error);
    return res.status(500).json({ error: 'Failed to keep database alive', details: error.message });
  }
} 