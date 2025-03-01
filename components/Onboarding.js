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
    },
    {
      id: 2,
      title: 'MyShadow',
      subtitle: 'Выбери фантазии, которые заводят тебя',
      footer: 'Свайпай влево и вправо',
    },
    {
      id: 3,
      title: 'MyShadow',
      subtitle: 'Отправь партнеру секретный код',
      footer: 'Создай пару и узнай совпадения',
    },
    {
      id: 4,
      title: 'MyShadow',
      subtitle: 'Узнайте фантазии, которые заводят вас обоих',
      footer: 'Анонимно и безопасно',
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
              
              {/* Место для будущих иллюстраций */}
              <div className="slide-illustration-placeholder"></div>
              
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
          justify-content: space-between;
          padding-bottom: 20px;
        }
        
        .slides-container {
          flex: 1;
          position: relative;
          width: 100%;
          height: calc(100% - 40px);
          display: flex;
          justify-content: center;
          align-items: center;
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
          padding: 0;
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
          width: 90%;
          height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          text-align: center;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(5px);
        }
        
        .slide-title {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 1rem;
          background: linear-gradient(90deg, #ff6b6b, #6b66ff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 1px;
        }
        
        .slide-subtitle {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: var(--tg-theme-text-color, #000000);
          line-height: 1.4;
        }
        
        .slide-illustration-placeholder {
          width: 100%;
          flex: 1;
          margin: 1rem 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .slide-footer {
          margin-top: 1rem;
          font-size: 1rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .dots-container {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          z-index: 100;
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          padding: 10px 0;
          height: 30px;
        }
        
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .dot.active {
          background-color: white;
          transform: scale(1.3);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        }
        
        .start-button {
          margin-top: 1rem;
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
      `}</style>
    </div>
  );
} 