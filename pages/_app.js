import '../styles/globals.css';
import { UserProvider, useUser } from '../utils/context';
import TelegramScript from '../components/TelegramScript';
import SwipeHandler from '../components/SwipeHandler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingScreen from '../components/LoadingScreen';
import AgeVerification from '../components/AgeVerification';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Создаем клиент запросов с настройками кэширования
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные в кэше будут считаться свежими 5 минут
      staleTime: 5 * 60 * 1000,
      // Кэш хранится 1 час
      cacheTime: 60 * 60 * 1000,
      // Повторные попытки при ошибке
      retry: 1,
    },
  },
});

// Компонент-обертка приложения
function AppWrapper({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <TelegramScript />
          <AppWithLoading Component={Component} pageProps={pageProps} />
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// Компонент с логикой загрузки
function AppWithLoading({ Component, pageProps }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [isContentReady, setIsContentReady] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  
  // Отслеживаем загрузку данных пользователя
  useEffect(() => {
    if (!userLoading && user && isAgeVerified) {
      const timer = setTimeout(() => {
        setIsContentReady(true);
        
        // Если мы на индексной странице, перенаправляем на страницу вопросов
        if (router.pathname === '/') {
          router.replace('/questions');
        }
        
        // Начинаем загружать данные о партнере и совпадениях
        queryClient.prefetchQuery({
          queryKey: ['user-matches', user.id || user.tgId],
          queryFn: async () => {
            const response = await fetch(`/api/matches?userId=${user.id || user.tgId}`);
            if (!response.ok) {
              throw new Error('Failed to load matches data');
            }
            return response.json();
          },
        });
      }, 1500); // Небольшая задержка для плавного UX
      
      return () => clearTimeout(timer);
    }
  }, [userLoading, user, router, isAgeVerified]);
  
  // Показываем загрузочный экран, если данные еще не загружены
  if (userLoading) {
    return <LoadingScreen timeout={10000} />;
  }
  
  // Когда данные пользователя загружены, но не прошла проверка возраста
  if (!userLoading && user && !isAgeVerified) {
    return (
      <AgeVerification 
        user={user} 
        onVerified={() => {
          console.log('Возраст подтвержден');
          setIsAgeVerified(true);
        }} 
      />
    );
  }
  
  // Показываем загрузочный экран, если данные еще не готовы после проверки возраста
  if (!isContentReady) {
    return <LoadingScreen timeout={10000} />;
  }
  
  // Рендерим контент приложения, когда все данные готовы и возраст подтвержден
  return (
    <SwipeHandler>
      <Component {...pageProps} />
    </SwipeHandler>
  );
}

export default AppWrapper; 