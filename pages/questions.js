import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { initTelegramApp, saveUserData, setupBackButton, setupHeader } from '../utils/telegram';
import { useUser } from '../utils/context';
import BlocksList from '../components/BlocksList';
import BottomMenu from '../components/BottomMenu';
import HowItWorksLink from '../components/HowItWorksLink';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBlocksWithQuestions, pingDatabase, fetchQuestions } from '../utils/api';

export default function Questions() {
  const { user } = useUser();
  const [telegramInitialized, setTelegramInitialized] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Используем React Query для загрузки блоков
  const { 
    data: blocksData = [], 
    isLoading: blocksLoading, 
    error: blocksError 
  } = useQuery({
    queryKey: ['blocks-with-questions', user?.id || user?.tgId],
    queryFn: () => fetchBlocksWithQuestions(user?.id || user?.tgId),
    // Не запрашиваем данные, пока не получим пользователя
    enabled: !!user,
    // Данные блоков будут считаться свежими 5 минут
    staleTime: 5 * 60 * 1000,
    // Повторяем запрос при ошибке
    retry: 3,
    // Увеличиваем интервал между повторными запросами
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Проверяем формат данных и обеспечиваем, что blocks всегда массив
  const blocks = useMemo(() => {
    if (blocksData && Array.isArray(blocksData)) {
      return blocksData;
    } else if (blocksData && typeof blocksData === 'object' && Array.isArray(blocksData.blocks)) {
      return blocksData.blocks;
    } else {
      console.error('Неожиданный формат данных блоков:', blocksData);
      return [];
    }
  }, [blocksData]);

  // Пингуем базу данных при загрузке страницы
  useEffect(() => {
    async function warmupDatabase() {
      try {
        await pingDatabase();
        console.log('Database warmed up successfully');
      } catch (error) {
        console.error('Failed to warm up database:', error);
      }
    }
    
    warmupDatabase();
  }, []);

  // Предварительно загружаем данные для блоков
  useEffect(() => {
    if (blocks.length > 0 && user) {
      // Предзагружаем первые 10 вопросов для каждого блока
      blocks.forEach(block => {
        queryClient.prefetchQuery({
          queryKey: ['questions', block.id, user?.id || user?.tgId, 1],
          queryFn: () => fetchQuestions(block.id, user?.id || user?.tgId, 1, 10),
          staleTime: 5 * 60 * 1000,
        });
      });
    }
  }, [blocks, user, queryClient]);

  // Обрабатываем ошибку загрузки блоков
  useEffect(() => {
    if (blocksError) {
      setError('Не удалось загрузить блоки вопросов');
      console.error('Ошибка при загрузке блоков:', blocksError);
    }
  }, [blocksError]);

  // Настраиваем интерфейс Telegram WebApp
  useEffect(() => {
    // Скрываем кнопку "Назад" на главной странице
    setupBackButton(false);
    
    // Устанавливаем заголовок приложения
    setupHeader({ title: 'MyShadow' });
  }, []);

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
        ) : blocksLoading ? (
          <div className="loading">Загрузка блоков...</div>
        ) : (
          <BlocksList blocks={blocks} />
        )}
        
        {!blocksLoading && blocks.length === 0 && !error && (
          <div className="loading">
            Нет доступных блоков вопросов
          </div>
        )}
        
        <HowItWorksLink />
      </main>
      
      <BottomMenu />

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
          padding-top: 6rem;
        }
        
        .app-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 3rem;
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