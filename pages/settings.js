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

  return (
    <div className="container">
      <Head>
        <title>Настройки | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Настройки MyShadowApp" />
      </Head>

      <main className="main">
        <div className="settings-container">
          <h1 className="settings-title">Настройки</h1>
          
          {message && (
            <div className="message success">{message}</div>
          )}
          
          {error && (
            <div className="message error">{error}</div>
          )}
          
          <div className="settings-section">
            <h2 className="section-title">Управление данными</h2>
            
            {!showConfirmation ? (
              <button 
                className="clear-answers-btn"
                onClick={() => setShowConfirmation(true)}
                disabled={isDeleting || !user}
              >
                Очистить все ответы
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
          </div>
          
          <div className="settings-section danger-section">
            <h2 className="section-title">Удаление аккаунта</h2>
            
            {!showAccountDeleteConfirmation ? (
              <button 
                className="delete-account-btn"
                onClick={() => setShowAccountDeleteConfirmation(true)}
                disabled={isDeletingAccount || !user}
              >
                Удалить аккаунт
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
        
        .settings-container {
          padding: 1rem;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .settings-title {
          font-size: 1.8rem;
          margin-bottom: 2rem;
          text-align: center;
          background: linear-gradient(90deg, #ff6b6b, #6b66ff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 1px;
          font-weight: bold;
        }
        
        .settings-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          border-radius: 12px;
        }
        
        .danger-section {
          background-color: rgba(255, 59, 48, 0.05);
          border: 1px solid rgba(255, 59, 48, 0.2);
        }
        
        .section-title {
          font-size: 1.2rem;
          margin-top: 0;
          margin-bottom: 1.5rem;
        }
        
        .clear-answers-btn, .delete-account-btn {
          width: 100%;
          padding: 0.8rem;
          background-color: var(--tg-theme-destructive-text-color, #ff3b30);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .delete-account-btn {
          background-color: var(--tg-theme-destructive-text-color, #ff3b30);
        }
        
        .clear-answers-btn:disabled, .delete-account-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .confirmation-box {
          background-color: rgba(255, 59, 48, 0.1);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--tg-theme-destructive-text-color, #ff3b30);
        }
        
        .confirmation-box.danger {
          background-color: rgba(255, 59, 48, 0.15);
          border: 1px solid var(--tg-theme-destructive-text-color, #ff3b30);
        }
        
        .confirmation-text {
          margin-top: 0;
          margin-bottom: 1rem;
          color: var(--tg-theme-destructive-text-color, #ff3b30);
          font-weight: 500;
        }
        
        .confirmation-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .confirm-btn, .cancel-btn {
          flex: 1;
          padding: 0.8rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .confirm-btn {
          background-color: var(--tg-theme-destructive-text-color, #ff3b30);
          color: white;
        }
        
        .cancel-btn {
          background-color: var(--tg-theme-button-color, #2481cc);
          color: white;
        }
        
        .confirm-btn:disabled, .cancel-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .success {
          background-color: rgba(52, 199, 89, 0.1);
          border: 1px solid rgba(52, 199, 89, 0.5);
          color: #34c759;
        }
        
        .error {
          background-color: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.5);
          color: var(--tg-theme-destructive-text-color, #ff3b30);
        }
      `}</style>
    </div>
  );
} 