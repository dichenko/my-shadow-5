import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { initTelegramApp, saveUserData } from '../utils/telegram';
import { useUser } from '../utils/context';
import LoadingScreen from '../components/LoadingScreen';
import UserPhoto from '../components/UserPhoto';
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
        const response = await fetch('/api/blocks-with-questions');
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
  }, []);

  // Если данные из Telegram не получены в течение 5 секунд, показываем экран с предложением перейти в бот
  if (userLoading && !user) {
    return <LoadingScreen timeout={5000} />;
  }

  return (
    <div className="container">
      <Head>
        <title>Вопросы | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Блоки вопросов MyShadowApp" />
      </Head>

      <div className="top-icons">
        <div className="icon-button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <UserPhoto />
      </div>

      <main className="main">
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
        
        .top-icons {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 1rem;
          z-index: 10;
        }

        .icon-button {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--tg-theme-button-color, #2481cc);
          background: var(--tg-theme-bg-color, #ffffff);
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .icon-button:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .main {
          flex: 1;
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