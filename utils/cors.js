/**
 * Утилиты для работы с CORS
 */

/**
 * Добавляет CORS заголовки к ответу
 * @param {object} res - HTTP ответ
 * @param {string} origin - Origin запроса
 */
export function setCorsHeaders(res, origin = null) {
  // Для корректной работы с cookies, нужно указать конкретный origin, а не *
  const allowedOrigin = origin || (process.env.NODE_ENV === 'production' 
    ? process.env.VERCEL_URL || 'https://my-shadow5.vercel.app' 
    : 'http://localhost:3000');
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Отключаем кеширование для API запросов
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * Обработчик OPTIONS запросов для CORS
 * @param {object} req - HTTP запрос
 * @param {object} res - HTTP ответ
 * @returns {boolean} true если запрос был обработан
 */
export function handleCorsOptions(req, res) {
  const origin = req.headers.origin || null;
  
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, origin);
    res.status(200).end();
    return true;
  }
  
  // Устанавливаем заголовки CORS для всех запросов
  setCorsHeaders(res, origin);
  return false;
} 