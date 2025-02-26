// Утилиты для работы с Telegram WebApp API

export const getTelegramUser = () => {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    const user = webApp.initDataUnsafe?.user || null;
    console.log('Получены данные пользователя из Telegram WebApp:', user);
    return user;
  }
  console.log('Telegram WebApp не обнаружен или пользователь не авторизован');
  return null;
};

// Кеш для хранения URL фотографий пользователей
const photoCache = new Map();

// Функция для получения URL фотографии пользователя с кешированием
export const getUserPhotoUrl = async (userId) => {
  if (!userId) return null;
  
  // Проверяем, есть ли фото в памяти
  if (photoCache.has(userId)) {
    console.log('Получена фотография из кеша памяти');
    return photoCache.get(userId);
  }
  
  // Проверяем, есть ли фото в localStorage
  if (typeof window !== 'undefined') {
    const cachedPhoto = localStorage.getItem(`userPhoto_${userId}`);
    if (cachedPhoto) {
      console.log('Получена фотография из localStorage');
      // Сохраняем в памяти для быстрого доступа
      photoCache.set(userId, cachedPhoto);
      return cachedPhoto;
    }
  }
  
  try {
    // Сначала пробуем получить фотографию через наш API-эндпоинт
    const response = await fetch(`/api/user-photo?userId=${userId}`);
    
    if (response.ok) {
      const data = await response.json();
      const photoUrl = data.photoUrl;
      
      // Сохраняем в кеш
      photoCache.set(userId, photoUrl);
      
      // Сохраняем в localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`userPhoto_${userId}`, photoUrl);
      }
      
      return photoUrl;
    } 
    
    // Если не удалось получить через API, используем прямой URL к Telegram Avatar
    console.log('Используем прямой URL к Telegram Avatar');
    const fallbackUrl = `https://avatars.telegram.org/${userId}`;
    
    // Сохраняем в кеш
    photoCache.set(userId, fallbackUrl);
    
    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`userPhoto_${userId}`, fallbackUrl);
    }
    
    return fallbackUrl;
  } catch (error) {
    console.error('Ошибка при получении фотографии пользователя:', error);
    
    // В случае ошибки тоже используем прямой URL
    const fallbackUrl = `https://avatars.telegram.org/${userId}`;
    
    // Сохраняем в кеш
    photoCache.set(userId, fallbackUrl);
    
    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`userPhoto_${userId}`, fallbackUrl);
    }
    
    return fallbackUrl;
  }
};

export const initTelegramApp = () => {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    console.log('Инициализация Telegram WebApp...');
    webApp.ready();
    webApp.expand();
    console.log('Telegram WebApp успешно инициализирован');
    
    // Выводим информацию о WebApp
    console.log('Версия WebApp:', webApp.version);
    console.log('Платформа:', webApp.platform);
    console.log('Цветовая схема:', webApp.colorScheme);
  } else {
    console.log('Telegram WebApp не обнаружен');
  }
};

export const saveUserData = async (userData) => {
  try {
    console.log('Отправка данных пользователя на сервер:', userData);
    
    if (!userData || !userData.id) {
      console.error('Ошибка: отсутствует ID пользователя в данных');
      return null;
    }
    
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка при сохранении данных пользователя:', errorData);
      return null;
    }
    
    const result = await response.json();
    console.log('Данные пользователя успешно сохранены:', result);
    return result;
  } catch (error) {
    console.error('Ошибка при отправке данных пользователя:', error);
    return null;
  }
}; 