import { createContext, useContext, useState, useEffect } from 'react';
import { getTelegramUser } from './telegram';

// Создаем контекст для пользователя
const UserContext = createContext();

// Провайдер контекста пользователя
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [serverUser, setServerUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
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
              const errorData = await response.json();
              console.error('Не удалось сохранить данные пользователя. Статус:', response.status, 'Ошибка:', errorData);
            } else {
              const userData = await response.json();
              console.log('Данные пользователя успешно сохранены на сервере:', userData);
              setServerUser(userData);
              
              // Сохраняем ID пользователя в localStorage для использования в случае проблем с cookie
              localStorage.setItem('userId', userData.id.toString());
            }
          } catch (saveError) {
            console.error('Ошибка при сохранении данных пользователя:', saveError);
          }
          
          setUser({
            ...telegramUser,
            // Добавляем дополнительную информацию для отладки
            _source: 'telegram'
          });
        } else {
          console.error('Не удалось получить данные пользователя из Telegram WebApp');
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
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

  return (
    <UserContext.Provider value={{ user: combinedUser, loading, serverUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Хук для использования контекста пользователя
export function useUser() {
  return useContext(UserContext);
} 