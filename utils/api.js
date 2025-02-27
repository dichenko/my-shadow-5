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

/**
 * Получение кода пары
 * @returns {Promise<Object>} - Информация о коде пары
 */
export async function fetchPairCode() {
  const response = await fetch('/api/pair-code');
  
  if (!response.ok) {
    throw new Error('Не удалось получить код пары');
  }
  
  return response.json();
}

/**
 * Получение совпадающих желаний
 * @returns {Promise<Object>} - Информация о совпадающих желаниях
 */
export async function fetchMatchingDesires() {
  const response = await fetch('/api/matching-desires');
  
  if (!response.ok) {
    throw new Error('Не удалось получить совпадающие желания');
  }
  
  return response.json();
}

/**
 * Создание пары
 * @param {string} pairCode - Код партнера
 * @returns {Promise<Object>} - Результат создания пары
 */
export async function createPair(pairCode) {
  const response = await fetch('/api/create-pair', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pairCode }),
  });
  
  if (!response.ok) {
    throw new Error('Не удалось создать пару');
  }
  
  return response.json();
}

/**
 * Удаление пары
 * @returns {Promise<Object>} - Результат удаления пары
 */
export async function deletePair() {
  const response = await fetch('/api/delete-pair', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Не удалось удалить пару');
  }
  
  return response.json();
} 