import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BottomMenu from '../components/BottomMenu';
import { useUser } from '../utils/context';
import { useQueryClient } from '@tanstack/react-query';
import { setupBackButton, setupHeader } from '../utils/telegram';

export default function Settings() {
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAccountDeleteConfirmation, setShowAccountDeleteConfirmation] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Настраиваем интерфейс Telegram WebApp
  useEffect(() => {
    // Показываем кнопку "Назад" и устанавливаем обработчик
    setupBackButton(true, () => {
      // При нажатии на кнопку "Назад" возвращаемся на главную страницу
      router.push('/questions');
    });
    
    // Устанавливаем заголовок страницы
    setupHeader({ title: 'Настройки' });
    
    // При размонтировании компонента скрываем кнопку "Назад"
    return () => {
      setupBackButton(false);
      setupHeader({ title: 'MyShadow' });
    };
  }, [router]);

  // Функция для очистки всех ответов пользователя
  const clearAllAnswers = async () => {
    if (!user) {
      setError('Пользователь не авторизован');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      setMessage(null);

      // Определяем, какой ID использовать: внутренний ID базы данных или Telegram ID
      const userId = user.id || user.tgId;

      const response = await fetch(`/api/delete-user-answers?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось удалить ответы');
      }

      setMessage(data.message || 'Все ваши ответы успешно удалены');
      setShowConfirmation(false);
      
      // Инвалидируем кэш для обновления счетчика ответов
      await queryClient.invalidateQueries(['blocks-with-questions']);
      
      // Устанавливаем таймаут для перенаправления на главную страницу
      setTimeout(() => {
        router.push('/questions');
      }, 1500);
      
    } catch (err) {
      console.error('Ошибка при удалении ответов:', err);
      setError(err.message || 'Не удалось удалить ответы. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Функция для удаления аккаунта пользователя
  const deleteAccount = async () => {
    if (!user) {
      setError('Пользователь не авторизован');
      return;
    }

    try {
      setIsDeletingAccount(true);
      setError(null);
      setMessage(null);

      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось удалить аккаунт');
      }

      setMessage(data.message || 'Ваш аккаунт успешно удален');
      setShowAccountDeleteConfirmation(false);
      
      // Закрываем Telegram WebApp через 2 секунды
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
          window.Telegram.WebApp.close();
        } else {
          // Если не в Telegram, перенаправляем на главную
          router.push('/');
        }
      }, 2000);
      
    } catch (err) {
      console.error('Ошибка при удалении аккаунта:', err);
      setError(err.message || 'Не удалось удалить аккаунт. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Функция для перенаправления в Telegram бот
  const contactDeveloper = () => {
    if (typeof window !== 'undefined') {
      window.open('https://t.me/QA_MyShadow_bot', '_blank');
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Настройки | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Настройки MyShadowApp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap" rel="stylesheet" />
      </Head>

      <main className="main">
        <h1 className="app-title">MyShadow</h1>
        <div className="settings-container">
          <h2 className="settings-title">Настройки</h2>
          
          {message && (
            <div className="message success">{message}</div>
          )}
          
          {error && (
            <div className="message error">{error}</div>
          )}
          
          <div className="settings-menu">
            {!showConfirmation ? (
              <button 
                className="menu-item clear-answers-btn"
                onClick={() => setShowConfirmation(true)}
                disabled={isDeleting || !user}
              >
                <span className="icon">🗑️</span>
                <span className="text">Очистить все ответы</span>
              </button>
            ) : (
              <div className="confirmation-box">
                <p className="confirmation-text">Вы уверены, что хотите удалить все свои ответы? Это действие нельзя отменить.</p>
                <div className="confirmation-buttons">
                  <button 
                    className="confirm-btn"
                    onClick={clearAllAnswers}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Удаление...' : 'Да, удалить все'}
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowConfirmation(false)}
                    disabled={isDeleting}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
            
            {!showAccountDeleteConfirmation ? (
              <button 
                className="menu-item delete-account-btn"
                onClick={() => setShowAccountDeleteConfirmation(true)}
                disabled={isDeletingAccount || !user}
              >
                <span className="icon">⚠️</span>
                <span className="text">Удалить аккаунт</span>
              </button>
            ) : (
              <div className="confirmation-box danger">
                <p className="confirmation-text">Это необратимое действие, все ваши данные будут удалены из приложения. Если у вас есть партнер в приложении, он получит сообщение, что вы удалили свой профиль из MyShadow.</p>
                <div className="confirmation-buttons">
                  <button 
                    className="confirm-btn"
                    onClick={deleteAccount}
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? 'Удаление...' : 'Да, удалить аккаунт'}
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowAccountDeleteConfirmation(false)}
                    disabled={isDeletingAccount}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
            
            <button 
              className="menu-item contact-btn"
              onClick={contactDeveloper}
            >
              <span className="icon">💬</span>
              <span className="text">Написать разработчику</span>
            </button>
          </div>
        </div>
      </main>

      <BottomMenu activePage="settings" />

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
          padding-top: 2rem;
          padding-bottom: 5rem;
        }
        
        .app-title {
          text-align: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          background: linear-gradient(90deg, #ff6b6b, #6b66ff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 1px;
        }
        
        .settings-container {
          padding: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .settings-title {
          font-size: 1.8rem;
          margin-bottom: 2rem;
          text-align: center;
          color: var(--tg-theme-text-color, #000000);
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 0.5px;
          font-weight: bold;
        }
        
        .settings-menu {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .menu-item {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-radius: 12px;
          background-color: var(--tg-theme-bg-color, #ffffff);
          border: 1px solid var(--tg-theme-button-color, #5288c1);
          color: var(--tg-theme-text-color, #000000);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .menu-item:hover, .menu-item:focus {
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .menu-item:active {
          transform: translateY(0);
          box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
        }
        
        .menu-item .icon {
          font-size: 1.5rem;
          margin-right: 1rem;
        }
        
        .menu-item .text {
          flex: 1;
        }
        
        .clear-answers-btn {
          border-color: var(--tg-theme-button-color, #5288c1);
        }
        
        .delete-account-btn {
          border-color: var(--tg-theme-destructive-text-color, #ff0000);
          color: var(--tg-theme-destructive-text-color, #ff0000);
        }
        
        .contact-btn {
          border-color: var(--tg-theme-button-color, #5288c1);
          background-color: var(--tg-theme-button-color, #5288c1);
          color: var(--tg-theme-button-text-color, #ffffff);
        }
        
        .confirmation-box {
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .confirmation-box.danger {
          border-left: 4px solid var(--tg-theme-destructive-text-color, #ff0000);
        }
        
        .confirmation-text {
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        
        .confirmation-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .confirm-btn, .cancel-btn {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          flex: 1;
          border: none;
          transition: all 0.2s ease;
        }
        
        .confirm-btn {
          background-color: var(--tg-theme-destructive-text-color, #ff0000);
          color: white;
        }
        
        .cancel-btn {
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          border: 1px solid var(--tg-theme-hint-color, #999999);
          color: var(--tg-theme-text-color, #000000);
        }
        
        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .success {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }
        
        .error {
          background-color: rgba(244, 67, 54, 0.1);
          color: var(--tg-theme-destructive-text-color, #ff0000);
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 