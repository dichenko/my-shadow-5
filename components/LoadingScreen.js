import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LoadingScreen({ timeout = 5000 }) {
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRedirect(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  return (
    <div className="loading-container">
      {!showRedirect ? (
        <div className="loading-content">
          <div className="logo">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="5" />
              <path d="M30 50 L45 65 L70 35" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="loading-text">Загрузка...</div>
        </div>
      ) : (
        <div className="redirect-content">
          <h2>Не удалось получить данные из Telegram</h2>
          <p>Пожалуйста, перейдите в наш телеграм-бот для корректной работы приложения.</p>
          <Link href="https://t.me/MyShadowApp_bot" legacyBehavior>
            <a className="telegram-button">
              Перейти в @MyShadowApp_bot
            </a>
          </Link>
        </div>
      )}

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
          padding: 1rem;
        }
        
        .loading-content, .redirect-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .logo {
          color: var(--tg-theme-button-color, #2481cc);
          animation: pulse 1.5s infinite;
          margin-bottom: 2rem;
        }
        
        .loading-text {
          font-size: 1.2rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        @keyframes pulse {
          0% {
            opacity: 0.6;
            transform: scale(0.98);
          }
          50% {
            opacity: 1;
            transform: scale(1.02);
          }
          100% {
            opacity: 0.6;
            transform: scale(0.98);
          }
        }
        
        .redirect-content h2 {
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        
        .redirect-content p {
          margin-bottom: 2rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .telegram-button {
          background-color: var(--tg-theme-button-color, #2481cc);
          color: var(--tg-theme-button-text-color, #ffffff);
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          font-size: 1rem;
          text-decoration: none;
          transition: background-color 0.3s;
          display: inline-block;
        }
        
        .telegram-button:hover {
          background-color: var(--tg-theme-button-color, #1a6baa);
        }
      `}</style>
    </div>
  );
} 