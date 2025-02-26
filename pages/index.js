import { useEffect, useState } from 'react';
import Head from 'next/head';
import { getTelegramUser, saveUserData, initTelegramApp, getUserPhotoUrl } from '../utils/telegram';

export default function Home() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

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
            
            // Получаем URL фотографии пользователя
            setPhotoLoading(true);
            try {
              const userPhotoUrl = await getUserPhotoUrl(telegramUser.id);
              if (userPhotoUrl) {
                setPhotoUrl(userPhotoUrl);
                console.log('Получен URL фотографии пользователя:', userPhotoUrl);
              } else {
                console.log('Фотография пользователя не найдена');
              }
            } catch (photoError) {
              console.error('Ошибка при получении фотографии пользователя:', photoError);
            } finally {
              setPhotoLoading(false);
            }
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

  // Функция для генерации аватара на основе имени пользователя
  const getAvatarUrl = (user) => {
    if (!user) return null;
    return `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name || ''}&background=random&color=fff&size=128`;
  };

  return (
    <div className="container">
      <Head>
        <title>Telegram WebApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Telegram WebApp Example" />
      </Head>

      {user && (
        <div className="user-photo">
          {photoLoading ? (
            <div className="photo-placeholder"></div>
          ) : (
            <img 
              src={photoUrl || getAvatarUrl(user)} 
              alt={`${user.first_name} ${user.last_name || ''}`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getAvatarUrl(user);
              }}
            />
          )}
        </div>
      )}

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
          position: relative;
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
        .user-photo {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          width: 40px;
          height: 40px;
        }
        .user-photo img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid var(--tg-theme-button-color, #2481cc);
          transition: all 0.3s ease;
          object-fit: cover;
        }
        .user-photo img:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }
        .photo-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          border: 2px solid var(--tg-theme-button-color, #2481cc);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
} 