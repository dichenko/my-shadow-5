// Утилиты для работы с Telegram WebApp API

// Функция для получения данных пользователя из Telegram WebApp
export function getTelegramUser() {
  try {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
        return webApp.initDataUnsafe.user;
      }
    }
    
    // Для отладки в браузере вне Telegram
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
      return {
        id: 12345678,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'ru',
        _debug: true
      };
    }
  } catch (error) {
    console.error('Ошибка при получении данных пользователя из Telegram WebApp:', error);
  }
  
  return null;
}

export const initTelegramApp = () => {
  try {
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
  } catch (error) {
    console.error('Ошибка при инициализации Telegram WebApp:', error);
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

/**
 * Управление кнопкой "Назад" в Telegram WebApp
 * @param {boolean} visible - Показывать ли кнопку
 * @param {Function} onClick - Функция, вызываемая при нажатии на кнопку
 */
export function setupBackButton(visible = false, onClick = null) {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.warn('Telegram WebApp не доступен');
    return;
  }
  
  const tg = window.Telegram.WebApp;
  
  // Устанавливаем видимость кнопки "Назад"
  if (visible) {
    tg.BackButton.show();
  } else {
    tg.BackButton.hide();
  }
  
  // Если передан обработчик клика, устанавливаем его
  if (onClick && typeof onClick === 'function') {
    tg.BackButton.onClick(onClick);
  }
}

/**
 * Настройка основной кнопки в Telegram WebApp
 * @param {Object} options - Параметры кнопки
 * @param {boolean} options.visible - Показывать ли кнопку
 * @param {string} options.text - Текст кнопки
 * @param {string} options.color - Цвет кнопки
 * @param {string} options.textColor - Цвет текста кнопки
 * @param {Function} options.onClick - Функция, вызываемая при нажатии на кнопку
 */
export function setupMainButton(options = {}) {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.warn('Telegram WebApp не доступен');
    return;
  }
  
  const tg = window.Telegram.WebApp;
  const mainButton = tg.MainButton;
  
  // Устанавливаем параметры кнопки
  if (options.text) mainButton.text = options.text;
  if (options.color) mainButton.color = options.color;
  if (options.textColor) mainButton.textColor = options.textColor;
  
  // Устанавливаем обработчик клика
  if (options.onClick && typeof options.onClick === 'function') {
    mainButton.onClick(options.onClick);
  }
  
  // Устанавливаем видимость кнопки
  if (options.visible) {
    mainButton.show();
  } else {
    mainButton.hide();
  }
}

/**
 * Настройка заголовка в Telegram WebApp
 * @param {Object} options - Параметры заголовка
 * @param {string} options.title - Текст заголовка
 * @param {string} options.color - Цвет заголовка (bg_color, secondary_bg_color)
 */
export function setupHeader(options = {}) {
  if (typeof window === 'undefined' || !window.Telegram || !window.Telegram.WebApp) {
    console.warn('Telegram WebApp не доступен');
    return;
  }
  
  const tg = window.Telegram.WebApp;
  
  // Устанавливаем параметры заголовка
  if (options.title) {
    tg.setHeaderColor(options.color || 'bg_color');
    tg.setTitle(options.title);
  }
} 