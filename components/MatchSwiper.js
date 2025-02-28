import { useState, useEffect, useRef } from 'react';

export default function MatchSwiper({ matches = [], onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);
  
  // Минимальное расстояние свайпа для срабатывания (в пикселях)
  const minSwipeDistance = 50;
  
  // Обработчики событий касания
  const onTouchStart = (e) => {
    // Предотвращаем всплытие события, чтобы не активировать навигацию между страницами
    e.stopPropagation();
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    // Предотвращаем всплытие события
    e.stopPropagation();
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = (e) => {
    // Предотвращаем всплытие события
    e.stopPropagation();
    
    if (!touchStart || !touchEnd || isAnimating) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (!isLeftSwipe && !isRightSwipe) return;
    
    if (isLeftSwipe && currentIndex < matches.length - 1) {
      // Свайп влево - следующий вопрос
      setIsAnimating(true);
      if (cardRef.current) {
        cardRef.current.classList.add('swiping-left');
      }
      
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.classList.remove('swiping-left');
          }
          setIsAnimating(false);
        }, 300);
      }, 100);
    } else if (isRightSwipe && currentIndex > 0) {
      // Свайп вправо - предыдущий вопрос
      setIsAnimating(true);
      if (cardRef.current) {
        cardRef.current.classList.add('swiping-right');
      }
      
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.classList.remove('swiping-right');
          }
          setIsAnimating(false);
        }, 300);
      }, 100);
    }
  };
  
  // Функция для отображения текста ответа
  const getAnswerText = (answer) => {
    switch (answer) {
      case 'yes':
        return 'ХОЧУ';
      case 'no':
        return 'НЕ ХОЧУ';
      case 'maybe':
        return 'СОМНЕВАЮСЬ';
      default:
        return answer;
    }
  };
  
  // Добавляем глобальные стили для анимации свайпа
  useEffect(() => {
    // Создаем элемент стиля
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .match-card.swiping-left {
        animation: swipeLeft 0.3s ease-out;
      }
      
      .match-card.swiping-right {
        animation: swipeRight 0.3s ease-out;
      }
      
      @keyframes swipeLeft {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0.5;
          transform: translateX(-30px);
        }
      }
      
      @keyframes swipeRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0.5;
          transform: translateX(30px);
        }
      }
    `;
    
    // Добавляем стили в head
    document.head.appendChild(styleElement);
    
    // Удаляем стили при размонтировании компонента
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Предотвращаем прокрутку страницы при свайпе внутри компонента
  useEffect(() => {
    const preventDefaultTouchMove = (e) => {
      if (e.target.closest('.match-swiper-container')) {
        e.preventDefault();
      }
    };
    
    // Добавляем обработчик события touchmove на документ
    document.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });
    
    // Удаляем обработчик при размонтировании компонента
    return () => {
      document.removeEventListener('touchmove', preventDefaultTouchMove);
    };
  }, []);
  
  if (matches.length === 0) {
    return (
      <div className="match-swiper-container">
        <div className="no-matches">
          <p>Нет совпадений в этом блоке</p>
        </div>
        <button className="close-button" onClick={onClose}>Закрыть</button>
        
        <style jsx>{`
          .match-swiper-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--tg-theme-bg-color, #ffffff);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          
          .no-matches {
            text-align: center;
            padding: 2rem;
            color: var(--tg-theme-hint-color);
          }
          
          .close-button {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1rem;
            color: var(--tg-theme-button-color, #2481cc);
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }
  
  const currentMatch = matches[currentIndex];
  
  // Создаем массив индикаторов
  const indicators = Array.from({ length: matches.length }, (_, index) => (
    <div 
      key={index} 
      className={`progress-indicator ${index === currentIndex ? 'active' : ''}`}
    />
  ));
  
  return (
    <div 
      className="match-swiper-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button className="close-button" onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      
      <div className="progress-indicators-container">
        {indicators}
      </div>
      
      <div className="match-counter">
        {currentIndex + 1} / {matches.length}
      </div>
      
      <div className="match-card" ref={cardRef}>
        <div className="match-question">
          {currentMatch.type === 'regular' ? (
            currentMatch.questionText
          ) : (
            currentMatch.userQuestionText
          )}
        </div>
        
        <div className="match-answer">
          {getAnswerText(currentMatch.userAnswer)}
        </div>
        
        <div className="match-info">
          {currentMatch.type === 'regular' ? (
            <div className="match-regular-info">
              <span className="user-answer">Вы: {getAnswerText(currentMatch.userAnswer)}</span>
              <span className="partner-answer">Партнер: {getAnswerText(currentMatch.partnerAnswer)}</span>
            </div>
          ) : (
            <div className="match-role-info">
              {currentMatch.userRole === 'giver' ? (
                <>
                  <span className="user-role">Вы хотите дать: {getAnswerText(currentMatch.userAnswer)}</span>
                  <span className="partner-role">Партнер хочет получить: {getAnswerText(currentMatch.partnerAnswer)}</span>
                </>
              ) : (
                <>
                  <span className="user-role">Вы хотите получить: {getAnswerText(currentMatch.userAnswer)}</span>
                  <span className="partner-role">Партнер хочет дать: {getAnswerText(currentMatch.partnerAnswer)}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="swipe-hint">
        <span>Свайпните для просмотра следующего совпадения</span>
      </div>
      
      <style jsx>{`
        .match-swiper-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--tg-theme-bg-color, #ffffff);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .progress-indicators-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 4px;
          padding: 12px;
          z-index: 1002;
        }
        
        .progress-indicator {
          height: 4px;
          flex: 1;
          max-width: 40px;
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
          transition: background-color 0.3s ease;
        }
        
        .progress-indicator.active {
          background-color: var(--tg-theme-button-color, #2481cc);
        }
        
        .close-button {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--tg-theme-hint-color);
          z-index: 1001;
        }
        
        .match-counter {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color);
        }
        
        .match-card {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          border-radius: 16px;
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .match-question {
          font-size: 1.4rem;
          font-weight: 500;
          text-align: center;
          line-height: 1.4;
        }
        
        .match-answer {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          color: var(--tg-theme-button-color, #2481cc);
        }
        
        .match-info {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .match-regular-info, .match-role-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        
        .user-answer, .user-role {
          color: var(--tg-theme-button-color, #2481cc);
        }
        
        .partner-answer, .partner-role {
          color: #9c27b0;
        }
        
        .swipe-hint {
          margin-top: 2rem;
          font-size: 0.8rem;
          color: var(--tg-theme-hint-color);
          text-align: center;
        }
      `}</style>
    </div>
  );
} 