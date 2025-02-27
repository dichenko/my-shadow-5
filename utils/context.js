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
        
        // Получаем данные пользователя из Telegram WebApp
        const telegramUser = getTelegramUser();
        
        console.log('Данные пользователя из Telegram WebApp:', telegramUser);
        
        if (telegramUser && telegramUser.id) {
          // Сохраняем данные пользователя на сервере
          try {
            console.log('Отправляем данные пользователя на сервер:', telegramUser);
            const response = await fetch('/api/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(telegramUser),
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMessage = `Не удалось сохранить данные пользователя. Статус: ${response.status}`;
              console.error(errorMessage, errorData);
              setError(errorMessage);
              
              // Отправляем ошибку на сервер для логирования
              try {
                fetch('/api/log-error', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    type: 'api_user_error',
                    status: response.status,
                    errorData,
                    telegramUser,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                  }),
                });
              } catch (e) {
                console.error('Failed to send error log:', e);
              }
            } else {
              const userData = await response.json().catch(() => ({}));
              console.log('Данные пользователя успешно сохранены на сервере:', userData);
              
              if (userData && userData.id) {
                setServerUser(userData);
                
                // Сохраняем ID пользователя в localStorage для использования в случае проблем с cookie
                try {
                  localStorage.setItem('userId', userData.id.toString());
                } catch (storageError) {
                  console.error('Ошибка при сохранении ID в localStorage:', storageError);
                }
              } else {
                const errorMessage = 'Получен пустой или некорректный ответ от API';
                console.error(errorMessage, userData);
                setError(errorMessage);
                
                // Отправляем ошибку на сервер для логирования
                try {
                  fetch('/api/log-error', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      type: 'invalid_user_data',
                      userData,
                      telegramUser,
                      url: window.location.href,
                      timestamp: new Date().toISOString()
                    }),
                  });
                } catch (e) {
                  console.error('Failed to send error log:', e);
                }
              }
            }
          } catch (saveError) {
            const errorMessage = 'Ошибка при сохранении данных пользователя';
            console.error(errorMessage, saveError);
            setError(`${errorMessage}: ${saveError.message}`);
            
            // Отправляем ошибку на сервер для логирования
            try {
              fetch('/api/log-error', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'save_user_error',
                  message: saveError.message,
                  stack: saveError.stack,
                  telegramUser,
                  url: window.location.href,
                  timestamp: new Date().toISOString()
                }),
              });
            } catch (e) {
              console.error('Failed to send error log:', e);
            }
          }
          
          setUser({
            ...telegramUser,
            // Добавляем дополнительную информацию для отладки
            _source: 'telegram'
          });
        } else {
          const errorMessage = 'Не удалось получить данные пользователя из Telegram WebApp';
          console.error(errorMessage);
          setError(errorMessage);
          
          // Отправляем ошибку на сервер для логирования
          try {
            fetch('/api/log-error', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'no_telegram_user',
                telegramUser,
                window_telegram: typeof window !== 'undefined' ? !!window.Telegram : false,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
              }),
            });
          } catch (e) {
            console.error('Failed to send error log:', e);
          }
          
          // Пытаемся восстановить ID пользователя из localStorage
          try {
            const storedUserId = localStorage.getItem('userId');
            if (storedUserId) {
              console.log('Восстановлен ID пользователя из localStorage:', storedUserId);
              setUser({
                id: parseInt(storedUserId, 10),
                _source: 'localStorage'
              });
            }
          } catch (storageError) {
            console.error('Ошибка при чтении из localStorage:', storageError);
          }
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
      } finally {
        setLoading(false);
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