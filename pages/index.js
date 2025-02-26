import { useEffect, useState } from 'react';
import Head from 'next/head';
import { getTelegramUser, saveUserData, initTelegramApp } from '../utils/telegram';

export default function Home() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initApp() {
      try {
        console.log('Инициализация приложения...');
        
        // Инициализируем Telegram WebApp
        initTelegramApp();
        
        // Получаем данные пользователя из Telegram WebApp
        const telegramUser = getTelegramUser();
        
        if (telegramUser) {
          console.log('Пользователь получен:', telegramUser);
          setUser(telegramUser);
          
          // Сохраняем данные пользователя
          try {
            const savedUser = await saveUserData(telegramUser);
            console.log('Данные пользователя сохранены:', savedUser);
          } catch (saveError) {
            console.error('Ошибка при сохранении данных пользователя:', saveError);
            setError('Не удалось сохранить данные пользователя');
          }
        } else {
          console.log('Пользователь не получен из Telegram WebApp');
          setError('Не удалось получить данные пользователя из Telegram');
        }
      } catch (e) {
        console.error('Ошибка при инициализации приложения:', e);
        setError('Произошла ошибка при инициализации приложения');
      } finally {
        setLoading(false);
      }
    }
    
    initApp();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Telegram WebApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Telegram WebApp Example" />
      </Head>

      <main className="main">
        {loading ? (
          <p className="loading">Загрузка...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <h1 className="title">
            Привет, {user ? user.first_name : 'гость'}!
          </h1>
        )}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
        }
        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
        }
        .loading {
          font-size: 1.5rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        .error {
          font-size: 1.5rem;
          color: var(--tg-theme-destructive-text-color, #ff0000);
          text-align: center;
          max-width: 80%;
        }
      `}</style>
    </div>
  );
} 