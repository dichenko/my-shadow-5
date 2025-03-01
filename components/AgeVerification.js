import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function AgeVerification({ user, onVerified }) {
  const [showAskAge, setShowAskAge] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  
  // Функция для закрытия приложения
  const closeApp = () => {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.close();
    } else {
      console.log('Не удалось закрыть приложение: WebApp не доступен');
      // Пытаемся использовать history API для возврата в Telegram
      window.history.back();
    }
  };
  
  // Проверяем данные пользователя при загрузке компонента
  useEffect(() => {
    if (user) {
      // Проверяем, есть ли данные о дате рождения в пользователе
      if (user.birthdate) {
        const birthdate = new Date(user.birthdate);
        const today = new Date();
        
        // Рассчитываем возраст
        let age = today.getFullYear() - birthdate.getFullYear();
        const monthDiff = today.getMonth() - birthdate.getMonth();
        
        // Если еще не было дня рождения в этом году, уменьшаем возраст на 1
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
          age--;
        }
        
        if (age >= 18) {
          // Пользователю 18 или больше, продолжаем работу приложения
          onVerified();
        } else {
          // Пользователю меньше 18, показываем уведомление
          setShowAskAge(false);
        }
      } else {
        // У пользователя нет даты рождения в профиле, показываем запрос
        setShowAskAge(true);
      }
    }
  }, [user, onVerified]);
  
  // Обработчик подтверждения возраста
  const handleAgeConfirm = async () => {
    if (!user || !user.id) {
      // Если нет ID пользователя, просто принимаем подтверждение
      onVerified();
      return;
    }
    
    setIsConfirming(true);
    setConfirmError(null);
    
    try {
      // Пытаемся сохранить информацию о подтверждении возраста
      const response = await fetch('/api/confirm-age', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });
      
      // Независимо от результата запроса, принимаем подтверждение пользователя
      onVerified();
    } catch (error) {
      console.error('Ошибка при подтверждении возраста:', error);
      // Даже при ошибке принимаем подтверждение пользователя
      onVerified();
    } finally {
      setIsConfirming(false);
    }
  };
  
  // Если дата рождения есть, но возраст < 18
  if (!showAskAge && !user?.birthdate) {
    return (
      <div className="age-verification">
        <div className="verification-content">
          <h1 className="app-title">MyShadow</h1>
          <div className="warning-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" 
                fill="currentColor"/>
            </svg>
          </div>
          <h2>Приложение 18+</h2>
          <p>Данное приложение предназначено только для пользователей старше 18 лет.</p>
          <button className="ok-button" onClick={closeApp}>ОК</button>
        </div>
        
        <style jsx>{`
          .age-verification {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: var(--tg-theme-bg-color, #ffffff);
            color: var(--tg-theme-text-color, #000000);
            padding: 1rem;
          }
          
          .verification-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 90%;
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
          
          .warning-icon {
            margin: 1.5rem 0;
            color: #e74c3c;
          }
          
          h2 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
            color: #e74c3c;
          }
          
          p {
            margin-bottom: 1.5rem;
            color: var(--tg-theme-hint-color, #999999);
          }
          
          .ok-button {
            background-color: var(--tg-theme-button-color, #2481cc);
            color: var(--tg-theme-button-text-color, #ffffff);
            border: none;
            border-radius: 8px;
            padding: 0.75rem 2rem;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.3s;
          }
          
          .ok-button:hover {
            background-color: var(--tg-theme-button-color, #1a6baa);
          }
        `}</style>
      </div>
    );
  }
  
  // Показываем запрос о возрасте, если нет даты рождения
  if (showAskAge) {
    return (
      <div className="age-verification">
        <div className="verification-content">
          <h1 className="app-title">MyShadow</h1>
          <div className="warning-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" 
                fill="currentColor"/>
            </svg>
          </div>
          <h2>Приложение 18+</h2>
          <p>Данное приложение предназначено только для пользователей старше 18 лет. Пожалуйста, подтвердите свой возраст.</p>
          
          {confirmError && (
            <div className="error-message">
              {confirmError}
            </div>
          )}
          
          <div className="button-group">
            <button 
              className="yes-button" 
              onClick={handleAgeConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? 'Подтверждение...' : 'Да, я старше 18 лет'}
            </button>
            <button className="no-button" onClick={closeApp} disabled={isConfirming}>Нет</button>
          </div>
        </div>
        
        <style jsx>{`
          .age-verification {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: var(--tg-theme-bg-color, #ffffff);
            color: var(--tg-theme-text-color, #000000);
            padding: 1rem;
          }
          
          .verification-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 90%;
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
          
          .warning-icon {
            margin: 1.5rem 0;
            color: #e74c3c;
          }
          
          h2 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
            color: #e74c3c;
          }
          
          p {
            margin-bottom: 1.5rem;
            color: var(--tg-theme-hint-color, #999999);
          }
          
          .error-message {
            margin-bottom: 1rem;
            padding: 0.75rem;
            color: #e74c3c;
            background-color: rgba(231, 76, 60, 0.1);
            border-radius: 8px;
            width: 100%;
            text-align: center;
          }
          
          .button-group {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            width: 100%;
          }
          
          .yes-button, .no-button {
            border: none;
            border-radius: 8px;
            padding: 0.75rem 2rem;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.3s;
            width: 100%;
          }
          
          .yes-button {
            background-color: var(--tg-theme-button-color, #2481cc);
            color: var(--tg-theme-button-text-color, #ffffff);
          }
          
          .yes-button:hover:not(:disabled) {
            background-color: var(--tg-theme-button-color, #1a6baa);
          }
          
          .no-button {
            background-color: var(--tg-theme-secondary-bg-color, #f2f2f2);
            color: var(--tg-theme-text-color, #000000);
          }
          
          .no-button:hover:not(:disabled) {
            background-color: #e0e0e0;
          }
          
          .yes-button:disabled, .no-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }
  
  // По умолчанию ничего не рендерим, если проверка возраста еще не завершена
  return null;
} 