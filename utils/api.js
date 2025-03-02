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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Не удалось загрузить блоки вопросов');
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Не удалось загрузить информацию о блоке');
  }
  
  return response.json();
}

/**
 * Получение вопросов блока с поддержкой пагинации
 * @param {string|number} blockId - ID блока
 * @param {string|number} userId - ID пользователя (опционально)
 * @param {number} page - Номер страницы (по умолчанию 1)
 * @param {number} limit - Количество элементов на странице (по умолчанию 50)
 * @returns {Promise<Object>} - Объект с вопросами и информацией о пагинации
 */
export async function fetchQuestions(blockId, userId, page = 1, limit = 50) {
  if (!blockId) return { questions: [], pagination: { total: 0, page, limit, totalPages: 0 } };
  
  let url = `/api/questions?blockId=${blockId}&page=${page}&limit=${limit}`;
  if (userId) {
    url += `&userId=${userId}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Не удалось загрузить вопросы блока');
  }
  
  return response.json();
}

/**
 * Отправка ответа на вопрос
 * @param {Object} answerData - Данные ответа
 * @returns {Promise<Object>} - Результат отправки
 */
export async function submitAnswer(answerData) {
  // Проверяем корректность данных перед отправкой
  if (!answerData.questionId || !answerData.userId || !answerData.text) {
    throw new Error('Неполные данные для отправки ответа');
  }
  
  // Убеждаемся, что questionId - это число
  const questionId = typeof answerData.questionId === 'string' 
    ? parseInt(answerData.questionId, 10) 
    : answerData.questionId;
    
  if (isNaN(questionId)) {
    throw new Error('Некорректный ID вопроса');
  }
  
  // Создаем копию данных с гарантированно числовым questionId
  const validatedData = {
    ...answerData,
    questionId
  };
  
  const response = await fetch('/api/answers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validatedData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    // Добавляем статус ответа к сообщению об ошибке для лучшей диагностики
    throw new Error(`${data.error || 'Не удалось отправить ответ'} (Статус: ${response.status})`);
  }
  
  return data;
}

/**
 * Получение кода пары
 * @returns {Promise<Object>} - Информация о коде пары
 */
export async function fetchPairCode() {
  const response = await fetch('/api/pair-code');
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось получить код пары');
  }
  
  return data;
}

/**
 * Получение совпадающих желаний
 * @returns {Promise<Object>} - Информация о совпадающих желаниях
 */
export async function fetchMatchingDesires() {
  const response = await fetch('/api/matching-desires');
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось получить совпадающие желания');
  }
  
  return data;
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
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось создать пару');
  }
  
  return data;
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
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось удалить пару');
  }
  
  return data;
}

/**
 * Пинг базы данных для предотвращения холодного старта
 * @returns {Promise<Object>} - Результат пинга
 */
export async function pingDatabase() {
  const response = await fetch('/api/keep-alive');
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось выполнить пинг базы данных');
  }
  
  return data;
} 