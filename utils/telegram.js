// Утилиты для работы с Telegram WebApp API

// Функция для получения данных пользователя из Telegram WebApp
export function getTelegramUser() {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    
    if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
      return webApp.initDataUnsafe.user;
    }
  }
  
  // Для отладки в браузере вне Telegram
  if (process.env.NODE_ENV === 'development') {
    return {
      id: 12345678,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'ru',
      _debug: true
    };
  }
  
  return null;
}

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