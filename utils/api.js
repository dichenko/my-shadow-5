// API-функции для работы с React Query

/**
 * Получение списка блоков с вопросами
 * @param {string|number} userId - ID пользователя (опционально)
 * @returns {Promise<Array>} - Массив блоков с вопросами
 */
export async function fetchBlocksWithQuestions(userId) {
  let url = '/api/blocks-with-questions';
  if (userId) {
    url += `?userId=${userId}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Не удалось загрузить блоки вопросов');
  }
  
  return response.json();
}

/**
 * Получение информации о блоке
 * @param {string|number} blockId - ID блока
 * @returns {Promise<Object>} - Информация о блоке
 */
export async function fetchBlock(blockId) {
  if (!blockId) return null;
  
  const response = await fetch(`/api/blocks?id=${blockId}`);
  if (!response.ok) {
    throw new Error('Не удалось загрузить информацию о блоке');
  }
  
  return response.json();
}

/**
 * Получение вопросов блока
 * @param {string|number} blockId - ID блока
 * @param {string|number} userId - ID пользователя (опционально)
 * @returns {Promise<Array>} - Массив вопросов
 */
export async function fetchQuestions(blockId, userId) {
  if (!blockId) return [];
  
  let url = `/api/questions?blockId=${blockId}`;
  if (userId) {
    url += `&userId=${userId}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Не удалось загрузить вопросы блока');
  }
  
  return response.json();
}

/**
 * Отправка ответа на вопрос
 * @param {Object} answerData - Данные ответа
 * @returns {Promise<Object>} - Результат отправки
 */
export async function submitAnswer(answerData) {
  const response = await fetch('/api/answers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answerData),
  });
  
  if (!response.ok) {
    throw new Error('Не удалось отправить ответ');
  }
  
  return response.json();
} 