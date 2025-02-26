import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getTelegramUser, saveUserData, initTelegramApp, getUserPhotoUrl } from '../utils/telegram';
import LoadingScreen from '../components/LoadingScreen';
import UserPhoto from '../components/UserPhoto';
import BlocksList from '../components/BlocksList';
import BottomMenu from '../components/BottomMenu';

export default function Questions() {
  const [user, setUser] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [telegramInitialized, setTelegramInitialized] = useState(false);
  const router = useRouter();

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
          setTelegramInitialized(true);
          
          // Сохраняем данные пользователя
          try {
            const savedUser = await saveUserData(telegramUser);
            console.log('Данные пользователя сохранены:', savedUser);
            
            // Получаем URL фотографии пользователя
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
      }
    }
    
    initApp();
  }, []);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const response = await fetch('/api/blocks-with-questions');
        if (!response.ok) {
          throw new Error('Не удалось загрузить блоки вопросов');
        }
        const data = await response.json();
        setBlocks(data);
      } catch (err) {
        console.error('Ошибка при загрузке блоков:', err);
        setError('Не удалось загрузить блоки вопросов');
      } finally {
        setLoading(false);
      }
    }

    if (telegramInitialized) {
      fetchBlocks();
    }
  }, [telegramInitialized]);

  // Если данные из Telegram не получены в течение 5 секунд, показываем экран с предложением перейти в бот
  if (!telegramInitialized && !user) {
    return <LoadingScreen timeout={5000} />;
  }

  return (
    <div className="container">
      <Head>
        <title>Вопросы | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Блоки вопросов MyShadowApp" />
      </Head>

      <UserPhoto user={user} photoUrl={photoUrl} />

      <main className="main">
        {loading ? (
          <div className="loading">Загрузка блоков...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <BlocksList blocks={blocks} />
        )}
      </main>

      <BottomMenu activePage="questions" />

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
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 50vh;
          font-size: 1.2rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .error {
          padding: 2rem;
          text-align: center;
          color: var(--tg-theme-destructive-text-color, #ff0000);
        }
      `}</style>
    </div>
  );
} 