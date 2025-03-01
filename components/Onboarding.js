import { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import Image from 'next/image';

export default function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const slidesRef = useRef([]);
  
  const slides = [
    {
      id: 1,
      title: 'MyShadow',
      subtitle: 'Узнай тайные фантазии своего партнера',
      footer: 'Анонимно и безопасно',
      illustration: null, // Будет заменено на реальное изображение
    },
    {
      id: 2,
      title: 'MyShadow',
      subtitle: 'Выбери фантазии, которые заводят тебя',
      illustration: (
        <div className="question-card-demo">
          <div className="question-text">
            Хотели бы вы попробовать ролевые игры?
          </div>
          <div className="question-buttons">
            <button className="btn-no">НЕ ХОЧУ</button>
            <button className="btn-yes">ХОЧУ</button>
            <button className="btn-maybe">СОМНЕВАЮСЬ</button>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'MyShadow',
      subtitle: 'Отправь партнеру секретный код',
      illustration: (
        <div className="code-container-demo">
          <div className="code-box">ABC123DEF456</div>
          <button className="copy-button-demo">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
      ),
    },
    {
      id: 4,
      title: 'MyShadow',
      subtitle: 'Узнайте фантазии, которые заводят вас обоих',
      footer: 'Анонимно и безопасно',
      illustration: (
        <div className="matches-demo">
          <div className="match-block">Романтика</div>
          <div className="match-block">Эксперименты</div>
          <div className="match-block">Фантазии</div>
        </div>
      ),
      showButton: true,
    },
  ];

  // Обработчик свайпов
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentSlide < slides.length - 1 && !animating) {
        nextSlide();
      }
    },
    onSwipedRight: () => {
      if (currentSlide > 0 && !animating) {
        prevSlide();
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  // Функция для перехода к следующему слайду
  const nextSlide = () => {
    if (currentSlide < slides.length - 1 && !animating) {
      setAnimating(true);
      setCurrentSlide(prev => prev + 1);
      setTimeout(() => setAnimating(false), 500);
    }
  };

  // Функция для перехода к предыдущему слайду
  const prevSlide = () => {
    if (currentSlide > 0 && !animating) {
      setAnimating(true);
      setCurrentSlide(prev => prev - 1);
      setTimeout(() => setAnimating(false), 500);
    }
  };

  // Функция для перехода к конкретному слайду
  const goToSlide = (index) => {
    if (index !== currentSlide && !animating) {
      setAnimating(true);
      setCurrentSlide(index);
      setTimeout(() => setAnimating(false), 500);
    }
  };

  // Функция для завершения онбординга
  const completeOnboarding = () => {
    // Сохраняем в localStorage, что пользователь прошел онбординг
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboardingCompleted', 'true');
    }
    onComplete();
  };

  return (
    <div className="onboarding-container" {...handlers}>
      <div className="slides-container">
        {slides.map((slide, index) => (
          <div 
            key={slide.id}
            ref={el => slidesRef.current[index] = el}
            className={`slide ${index === currentSlide ? 'active' : index < currentSlide ? 'prev' : 'next'}`}
          >
            <div className="slide-content">
              <h1 className="slide-title">{slide.title}</h1>
              <h2 className="slide-subtitle">{slide.subtitle}</h2>
              
              {slide.illustration && (
                <div className="slide-illustration">
                  {slide.illustration}
                </div>
              )}
              
              {slide.showButton && (
                <button className="start-button" onClick={completeOnboarding}>
                  ХОЧУ
                </button>
              )}
              
              {slide.footer && (
                <p className="slide-footer">{slide.footer}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="dots-container">
        {slides.map((_, index) => (
          <div 
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
      
      <style jsx>{`
        .onboarding-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--purple-200, #e9d5ff);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .slides-container {
          flex: 1;
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          opacity: 0;
          transform: translateX(100%);
          transition: transform 0.5s ease, opacity 0.5s ease;
        }
        
        .slide.active {
          opacity: 1;
          transform: translateX(0);
          z-index: 2;
        }
        
        .slide.prev {
          opacity: 0;
          transform: translateX(-100%);
          z-index: 1;
        }
        
        .slide.next {
          opacity: 0;
          transform: translateX(100%);
          z-index: 1;
        }
        
        .slide-content {
          max-width: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(5px);
          max-width: 90%;
        }
        
        .slide-title {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: var(--purple-600);
        }
        
        .slide-subtitle {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          color: var(--tg-theme-text-color, #000000);
          line-height: 1.4;
        }
        
        .slide-illustration {
          width: 100%;
          max-width: 320px;
          margin: 2rem 0;
          display: flex;
          justify-content: center;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
        }
        
        .slide-footer {
          margin-top: 2rem;
          font-size: 1rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .dots-container {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
          gap: 0.5rem;
          z-index: 10;
          position: relative;
        }
        
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .dot.active {
          background-color: white;
          transform: scale(1.2);
        }
        
        .start-button {
          margin-top: 2rem;
          padding: 1rem 3rem;
          font-size: 1.2rem;
          font-weight: bold;
          background-color: var(--purple-600);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.3s ease;
          box-shadow: 0 4px 10px rgba(168, 85, 247, 0.3);
        }
        
        .start-button:hover, .start-button:active {
          background-color: var(--purple-700);
          transform: scale(0.98);
        }
        
        /* Стили для демонстрационных элементов */
        .question-card-demo {
          width: 100%;
          max-width: 300px;
          padding: 1.5rem;
          background: linear-gradient(135deg, var(--purple-50) 0%, var(--purple-100) 100%);
          border-radius: 16px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }
        
        .question-text {
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .question-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        
        .btn-yes, .btn-no, .btn-maybe {
          padding: 0.8rem;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .btn-yes {
          background-color: var(--purple-600);
          color: white;
        }
        
        .btn-no {
          background-color: var(--app-error, #d32f2f);
          color: white;
        }
        
        .btn-maybe {
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          color: var(--tg-theme-text-color, #000000);
        }
        
        .code-container-demo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          max-width: 300px;
        }
        
        .code-box {
          flex: 1;
          padding: 1rem;
          background-color: var(--tg-theme-bg-color, #ffffff);
          border: 1px solid var(--purple-200);
          border-radius: 8px;
          font-family: monospace;
          font-size: 1.2rem;
          font-weight: bold;
          text-align: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .copy-button-demo {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--purple-600);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .matches-demo {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          max-width: 300px;
        }
        
        .match-block {
          padding: 1.2rem;
          background: linear-gradient(135deg, var(--purple-100) 0%, var(--purple-200) 100%);
          border-radius: 12px;
          font-weight: 500;
          text-align: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
} 