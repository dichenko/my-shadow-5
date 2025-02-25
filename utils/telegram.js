// Утилиты для работы с Telegram WebApp API

export const getTelegramUser = () => {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    return webApp.initDataUnsafe?.user || null;
  }
  return null;
};

export const initTelegramApp = () => {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    webApp.ready();
    webApp.expand();
  }
};

export const saveUserData = async (userData) => {
  try {
    const response = await fetch('/api/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving user data:', error);
    return null;
  }
}; 