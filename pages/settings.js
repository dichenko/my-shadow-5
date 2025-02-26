import { useEffect, useState } from 'react';
import Head from 'next/head';
import { getTelegramUser, getUserPhotoUrl } from '../utils/telegram';
import UserPhoto from '../components/UserPhoto';
import BottomMenu from '../components/BottomMenu';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    // Получаем данные пользователя из Telegram WebApp
    const telegramUser = getTelegramUser();
    if (telegramUser) {
      setUser(telegramUser);
      
      // Получаем URL фотографии пользователя
      getUserPhotoUrl(telegramUser.id).then(url => {
        if (url) setPhotoUrl(url);
      }).catch(err => {
        console.error('Ошибка при получении фотографии:', err);
      });
    }
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Настройки | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Настройки MyShadowApp" />
      </Head>

      <UserPhoto user={user} photoUrl={photoUrl} />

      <main className="main">
        <div className="coming-soon">
          <h1>Настройки</h1>
          <p>Эта функция будет доступна в ближайшее время</p>
        </div>
      </main>

      <BottomMenu activePage="settings" />

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0;
          display: flex;
          flex-direction: column;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
          position: relative;
        }
        
        .main {
          flex: 1;
          padding-top: 4rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .coming-soon {
          text-align: center;
          padding: 2rem;
        }
        
        .coming-soon h1 {
          font-size: 1.8rem;
          margin-bottom: 1rem;
        }
        
        .coming-soon p {
          color: var(--tg-theme-hint-color, #999999);
        }
      `}</style>
    </div>
  );
} 