import { useState } from 'react';
import Onboarding from './Onboarding';

export default function HowItWorksLink() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const openOnboarding = () => {
    setShowOnboarding(true);
    // Добавляем класс к body, чтобы предотвратить прокрутку страницы
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };
  
  const closeOnboarding = () => {
    setShowOnboarding(false);
    // Восстанавливаем прокрутку страницы
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };
  
  return (
    <>
      <div className="how-it-works-link" onClick={openOnboarding}>
        Как это работает?
      </div>
      
      {showOnboarding && (
        <div className="onboarding-wrapper">
          <Onboarding onComplete={closeOnboarding} />
        </div>
      )}
      
      <style jsx>{`
        .how-it-works-link {
          text-align: center;
          margin-top: 1rem;
          padding: 0.5rem;
          color: var(--tg-theme-link-color, var(--app-primary));
          font-size: 0.9rem;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
        
        .how-it-works-link:hover {
          opacity: 1;
          text-decoration: underline;
        }
        
        .onboarding-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
        }
      `}</style>
    </>
  );
} 