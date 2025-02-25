import { useEffect } from 'react';
import Script from 'next/script';
import { initTelegramApp } from '../utils/telegram';

const TelegramScript = () => {
  useEffect(() => {
    // Инициализация Telegram WebApp после загрузки скрипта
    if (window.Telegram) {
      initTelegramApp();
    }
  }, []);

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="beforeInteractive"
      onLoad={() => {
        if (window.Telegram) {
          initTelegramApp();
        }
      }}
    />
  );
};

export default TelegramScript; 