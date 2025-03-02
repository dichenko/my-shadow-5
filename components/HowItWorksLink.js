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
      <div className="floating-button" onClick={openOnboarding}>
        <span className="question-mark">?</span>
      </div>
      
      {showOnboarding && (
        <div className="onboarding-wrapper">
          <Onboarding onComplete={closeOnboarding} />
        </div>
      )}
      
      <style jsx>{`
        .floating-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff6b6b, #6b66ff);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          z-index: 999;
          transition: all 0.3s ease;
        }
        
        .floating-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        }
        
        .floating-button:active {
          transform: scale(0.95);
        }
        
        .question-mark {
          font-size: 24px;
          font-weight: bold;
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