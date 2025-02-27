import { useEffect, useState } from 'react';
import Script from 'next/script';
import { initTelegramApp } from '../utils/telegram';

const TelegramScript = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    // Инициализация Telegram WebApp после загрузки скрипта
    if (typeof window !== 'undefined' && window.Telegram) {
      try {
        console.log('Попытка инициализации Telegram WebApp из useEffect');
        initTelegramApp();
        setScriptLoaded(true);
      } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
        setInitError(error.message || 'Неизвестная ошибка при инициализации');
        
        // Отправляем ошибку на сервер для логирования
        try {
          fetch('/api/log-error', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'telegram_init_error',
              message: error.message,
              stack: error.stack,
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }),
          });
        } catch (e) {
          console.error('Failed to send error log:', e);
        }
      }
    } else {
      console.log('Telegram WebApp не обнаружен в useEffect');
    }
  }, []);

  const handleScriptLoad = () => {
    console.log('Скрипт Telegram WebApp загружен');
    if (typeof window !== 'undefined' && window.Telegram) {
      try {
        console.log('Попытка инициализации Telegram WebApp из onLoad');
        initTelegramApp();
        setScriptLoaded(true);
      } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp в onLoad:', error);
        setInitError(error.message || 'Неизвестная ошибка при инициализации в onLoad');
        
        // Отправляем ошибку на сервер для логирования
        try {
          fetch('/api/log-error', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'telegram_init_onload_error',
              message: error.message,
              stack: error.stack,
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }),
          });
        } catch (e) {
          console.error('Failed to send error log:', e);
        }
      }
    } else {
      console.log('Telegram WebApp не обнаружен в onLoad');
      setScriptError('Telegram WebApp не обнаружен после загрузки скрипта');
    }
  };

  const handleScriptError = (error) => {
    console.error('Ошибка при загрузке скрипта Telegram WebApp:', error);
    setScriptError(error.message || 'Неизвестная ошибка при загрузке скрипта');
    
    // Отправляем ошибку на сервер для логирования
    try {
      fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'telegram_script_load_error',
          message: error.message,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (e) {
      console.error('Failed to send error log:', e);
    }
  };

  // Отображаем ошибки в интерфейсе для отладки
  if (scriptError || initError) {
    return (
      <>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
          onLoad={handleScriptLoad}
          onError={handleScriptError}
        />
        <div style={{ 
          position: 'fixed', 
          bottom: '70px', 
          left: '10px', 
          right: '10px',
          padding: '10px', 
          backgroundColor: '#fff3cd', 
          color: '#856404',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <strong>Отладочная информация:</strong>
          {scriptError && <p>Ошибка скрипта: {scriptError}</p>}
          {initError && <p>Ошибка инициализации: {initError}</p>}
          <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent : 'недоступно'}</p>
          <p>Telegram WebApp доступен: {typeof window !== 'undefined' && window.Telegram ? 'Да' : 'Нет'}</p>
        </div>
      </>
    );
  }

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="beforeInteractive"
      onLoad={handleScriptLoad}
      onError={handleScriptError}
    />
  );
};

export default TelegramScript; 