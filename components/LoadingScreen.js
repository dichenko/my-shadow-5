import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
          <h1 className="app-title">MyShadow</h1>
          <div className="loader-image">
            <Image 
              src="/images/loading-image.png" 
              alt="Loading" 
              width={200} 
              height={200}
              priority 
            />
          </div>
          <div className="loading-text">Загрузка</div>
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
        
        .loader-image {
          margin: 2rem 0;
          animation: pulse 1.5s infinite;
        }
        
        .loading-text {
          font-size: 1.2rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            opacity: 1;
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
          background-color: var(--tg-theme-button-color, var(--app-primary));
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
          background-color: var(--tg-theme-button-color, var(--app-primary-dark));
        }
      `}</style>
    </div>
  );
} 