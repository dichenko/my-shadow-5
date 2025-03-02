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
        <span className="tooltip">Как это работает?</span>
      </div>
      
      {showOnboarding && (
        <div className="onboarding-wrapper">
          <Onboarding onComplete={closeOnboarding} />
        </div>
      )}
      
      <style jsx>{`
        .floating-button {
          position: fixed;
          bottom: 80px; /* Увеличиваем отступ снизу, чтобы не перекрывалось нижним меню */
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff6b6b, #6b66ff);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          z-index: 9999; /* Увеличиваем z-index, чтобы быть поверх всех элементов */
          transition: all 0.3s ease;
          animation: pulse 2s infinite; /* Добавляем анимацию пульсации */
        }
        
        .floating-button:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
        }
        
        .floating-button:active {
          transform: scale(0.95);
        }
        
        .question-mark {
          font-size: 28px;
          font-weight: bold;
        }
        
        .tooltip {
          position: absolute;
          top: -40px;
          right: 0;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 14px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          white-space: nowrap;
        }
        
        .floating-button:hover .tooltip {
          opacity: 1;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(107, 102, 255, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(107, 102, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(107, 102, 255, 0);
          }
        }
        
        .onboarding-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000; /* Увеличиваем z-index для онбординга */
        }
      `}</style>
    </>
  );
} 