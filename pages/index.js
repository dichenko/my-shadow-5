import { useEffect, useState } from 'react';
import Head from 'next/head';
import { getTelegramUser, saveUserData } from '../utils/telegram';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Получаем данные пользователя из Telegram WebApp
    const telegramUser = getTelegramUser();
    if (telegramUser) {
      setUser(telegramUser);
      saveUserData(telegramUser);
    }
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Telegram WebApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Telegram WebApp Example" />
      </Head>

      <main className="main">
        <h1 className="title">
          Привет, {user ? user.first_name : 'гость'}!
        </h1>
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
      `}</style>
    </div>
  );
} 