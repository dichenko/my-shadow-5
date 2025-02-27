import '../styles/globals.css';
import { UserProvider } from '../utils/context';
import TelegramScript from '../components/TelegramScript';
import SwipeHandler from '../components/SwipeHandler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';

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

function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <TelegramScript />
          <SwipeHandler>
            <Component {...pageProps} />
          </SwipeHandler>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default MyApp; 