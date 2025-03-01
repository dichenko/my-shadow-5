import { createContext, useContext, useState, useEffect } from 'react';
import { getTelegramUser } from './telegram';

// Создаем контекст для пользователя
const UserContext = createContext();

// Провайдер контекста пользователя
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [serverUser, setServerUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        console.log('Начало загрузки данных пользователя');
        
        // Проверяем, является ли текущая страница админ-панелью
        const isAdminPage = typeof window !== 'undefined' && 
          (window.location.pathname.startsWith('/admin') || 
           window.location.href.includes('/admin'));
        
        // Если это админ-панель, пропускаем проверку пользователя Telegram
        if (isAdminPage) {
          console.log('Обнаружена админ-панель, пропускаем проверку пользователя Telegram');
          setLoading(false);
          return;
        }
        
        // Получаем данные пользователя из Telegram WebApp
        const telegramUser = getTelegramUser();
        
        console.log('Данные пользователя из Telegram WebApp:', telegramUser);
        
        if (telegramUser && telegramUser.id) {
          // Устанавливаем данные пользователя в состояние, но не сохраняем на сервере
          // Сохранение будет происходить только после подтверждения возраста
          setUser(telegramUser);
          setLoading(false);
        } else {
          console.error('Не удалось получить данные пользователя из Telegram WebApp');
          setError('Не удалось получить данные пользователя');
          setLoading(false);
        }
      } catch (error) {
        const errorMessage = 'Ошибка при загрузке данных пользователя';
        console.error(errorMessage, error);
        setError(`${errorMessage}: ${error.message}`);
        
        // Отправляем ошибку на сервер для логирования
        try {
          fetch('/api/log-error', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'load_user_error',
              message: error.message,
              stack: error.stack,
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }),
          });
        } catch (e) {
          console.error('Failed to send error log:', e);
        }
      }
    }
    
    loadUserData();
  }, []);

  // Объединенный пользовательский объект с данными как от Telegram, так и от сервера
  const combinedUser = user && serverUser ? { 
    ...user, 
    dbId: serverUser.id, // ID пользователя в базе данных
    _serverData: serverUser // Полные данные с сервера (для отладки)
  } : user;

  // Отображаем ошибки в интерфейсе для отладки
  useEffect(() => {
    if (error && typeof document !== 'undefined') {
      const existingErrorDiv = document.getElementById('user-context-error');
      
      if (!existingErrorDiv) {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'user-context-error';
        errorDiv.style.position = 'fixed';
        errorDiv.style.bottom = '120px';
        errorDiv.style.left = '10px';
        errorDiv.style.right = '10px';
        errorDiv.style.padding = '10px';
        errorDiv.style.backgroundColor = '#f8d7da';
        errorDiv.style.color = '#721c24';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        
        errorDiv.innerHTML = `
          <strong>Ошибка контекста пользователя:</strong>
          <p>${error}</p>
          <p>User Agent: ${navigator.userAgent}</p>
          <p>Telegram WebApp доступен: ${typeof window !== 'undefined' && window.Telegram ? 'Да' : 'Нет'}</p>
        `;
        
        document.body.appendChild(errorDiv);
      }
    }
  }, [error]);

  return (
    <UserContext.Provider value={{ user: combinedUser, loading, serverUser, error }}>
      {children}
    </UserContext.Provider>
  );
}

// Хук для использования контекста пользователя
export function useUser() {
  return useContext(UserContext);
} 