import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { initTelegramApp, saveUserData } from '../utils/telegram';
import { useUser } from '../utils/context';
import LoadingScreen from '../components/LoadingScreen';
import BlocksList from '../components/BlocksList';
import BottomMenu from '../components/BottomMenu';

export default function Questions() {
  const { user, loading: userLoading } = useUser();
  const [telegramInitialized, setTelegramInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function initApp() {
      try {
        console.log('Инициализация приложения...');
        
        // Инициализируем Telegram WebApp
        initTelegramApp();
        setTelegramInitialized(true);
        
        // Сохраняем данные пользователя, если пользователь получен
        if (user) {
          try {
            const savedUser = await saveUserData(user);
            console.log('Данные пользователя сохранены:', savedUser);
          } catch (saveError) {
            console.error('Ошибка при сохранении данных пользователя:', saveError);
            setError('Не удалось сохранить данные пользователя');
          }
        } else {
          console.log('Пользователь не получен из контекста');
        }
      } catch (e) {
        console.error('Ошибка при инициализации приложения:', e);
        setError('Произошла ошибка при инициализации приложения');
      }
    }
    
    initApp();
  }, [user]);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        setLoading(true);
        
        // Добавляем userId в запрос, если пользователь получен
        let url = '/api/blocks-with-questions';
        if (user && user.id) {
          url += `?userId=${user.id}`;
        } else if (user && user.tgId) {
          url += `?userId=${user.tgId}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Не удалось загрузить блоки вопросов');
        }
        const data = await response.json();
        setBlocks(data);
      } catch (e) {
        console.error('Ошибка при загрузке блоков:', e);
        setError('Не удалось загрузить блоки вопросов');
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [user]);

  // Если данные из Telegram не получены в течение 5 секунд, показываем экран с предложением перейти в бот
  if (userLoading && !user) {
    return <LoadingScreen timeout={5000} />;
  }

  return (
    <div className="container">
      <Head>
        <title>Вопросы | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Вопросы MyShadowApp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap" rel="stylesheet" />
      </Head>

      <main className="main">
        <h1 className="app-title">MyShadow</h1>
        
        {error ? (
          <div className="error">{error}</div>
        ) : loading ? (
          <div className="loading">Загрузка блоков...</div>
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
        
        .app-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 2rem;
          background: linear-gradient(90deg, #ff6b6b, #6b66ff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 1px;
        }
        
        .error {
          padding: 2rem;
          text-align: center;
          color: var(--tg-theme-destructive-text-color, #ff0000);
        }

        .loading {
          padding: 2rem;
          text-align: center;
          color: var(--tg-theme-hint-color);
        }
      `}</style>
    </div>
  );
} 