import { useEffect } from 'react';
import Script from 'next/script';
import { initTelegramApp } from '../utils/telegram';

const TelegramScript = () => {
  useEffect(() => {
    // Инициализация Telegram WebApp после загрузки скрипта
    if (typeof window !== 'undefined' && window.Telegram) {
      try {
        initTelegramApp();
      } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
      }
    }
  }, []);

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="beforeInteractive"
      onLoad={() => {
        if (typeof window !== 'undefined' && window.Telegram) {
          try {
            initTelegramApp();
          } catch (error) {
            console.error('Ошибка при инициализации Telegram WebApp в onLoad:', error);
          }
        }
      }}
    />
  );
};

export default TelegramScript; 