import { createContext, useContext, useState, useEffect } from 'react';
import { getTelegramUser, getUserPhotoUrl } from './telegram';

// Создаем контекст для пользователя
const UserContext = createContext();

// Провайдер контекста пользователя
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        // Получаем данные пользователя из Telegram WebApp
        const telegramUser = getTelegramUser();
        
        if (telegramUser) {
          setUser(telegramUser);
          
          // Получаем URL фотографии пользователя
          const userPhotoUrl = await getUserPhotoUrl(telegramUser.id);
          if (userPhotoUrl) {
            setPhotoUrl(userPhotoUrl);
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, []);

  return (
    <UserContext.Provider value={{ user, photoUrl, loading }}>
      {children}
    </UserContext.Provider>
  );
}

// Хук для использования контекста пользователя
export function useUser() {
  return useContext(UserContext);
} 