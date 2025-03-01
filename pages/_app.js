import '../styles/globals.css';
import { UserProvider, useUser } from '../utils/context';
import TelegramScript from '../components/TelegramScript';
import SwipeHandler from '../components/SwipeHandler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingScreen from '../components/LoadingScreen';
import AgeVerification from '../components/AgeVerification';
import Onboarding from '../components/Onboarding';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { initTelegramApp } from '../utils/telegram';

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  
  // Проверяем, является ли пользователь новым
  useEffect(() => {
    if (!userLoading && user) {
      // Проверяем, является ли текущая страница админ-панелью
      const isAdminPage = typeof window !== 'undefined' && 
        (router.pathname.startsWith('/admin') || 
         window.location.pathname.startsWith('/admin'));
      
      if (isAdminPage) {
        // Для админ-панели пропускаем онбординг и проверку возраста
        setOnboardingCompleted(true);
        setIsAgeVerified(true);
        return;
      }
      
      // Проверяем, новый ли это пользователь (первый визит)
      const visitCount = user._serverData?.visitCount || user.visitCount || 0;
      
      if (visitCount <= 1) {
        // Это новый пользователь, показываем онбординг
        setShowOnboarding(true);
      } else {
        // Это существующий пользователь, пропускаем онбординг
        setOnboardingCompleted(true);
      }
    }
  }, [userLoading, user, router.pathname]);
  
  // Отслеживаем загрузку данных пользователя
  useEffect(() => {
    if (!userLoading && user && isAgeVerified && onboardingCompleted) {
      const timer = setTimeout(() => {
        setIsContentReady(true);
        
        // Если мы на индексной странице, перенаправляем на страницу вопросов
        if (router.pathname === '/') {
          window.location.href = '/questions';
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
  }, [userLoading, user, router, isAgeVerified, onboardingCompleted]);
  
  // Инициализируем Telegram WebApp при монтировании компонента
  useEffect(() => {
    console.log('Попытка инициализации Telegram WebApp из useEffect');
    
    // Проверяем, является ли текущая страница админ-панелью
    const isAdminPage = typeof window !== 'undefined' && 
      (window.location.pathname.startsWith('/admin') || 
       window.location.href.includes('/admin'));
    
    // Если это админ-панель, пропускаем инициализацию Telegram WebApp
    if (isAdminPage) {
      console.log('Обнаружена админ-панель, пропускаем инициализацию Telegram WebApp');
      return;
    }
    
    initTelegramApp();
  }, []);
  
  // Обработчик завершения онбординга
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingCompleted(true);
  };
  
  // Показываем загрузочный экран, если данные еще не загружены
  if (userLoading) {
    return <LoadingScreen timeout={10000} />;
  }
  
  // Проверяем, является ли текущая страница админ-панелью
  const isAdminPage = typeof window !== 'undefined' && 
    (router.pathname.startsWith('/admin') || 
     window.location.pathname.startsWith('/admin'));
  
  // Показываем онбординг для новых пользователей
  if (!userLoading && user && showOnboarding && !onboardingCompleted && !isAdminPage) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }
  
  // Когда данные пользователя загружены и онбординг пройден, но не прошла проверка возраста (кроме админ-панели)
  if (!userLoading && user && onboardingCompleted && !isAgeVerified && !isAdminPage) {
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
  
  // Показываем загрузочный экран, если данные еще не готовы после проверки возраста (кроме админ-панели)
  if (!isContentReady && !isAdminPage) {
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