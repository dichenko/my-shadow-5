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