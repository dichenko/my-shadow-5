import { useState, useEffect, useRef } from 'react';

export default function MatchSwiper({ matches = [], onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);
  
  // Добавляем состояния для обработки свайпа
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
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
  
  // Добавляем глобальные стили для анимации перехода между карточками
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
  
  // Добавляем функцию для обработки свайпа
  const handleSwipe = () => {
    if (!touchStart || !touchEnd || isAnimating) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // Минимальное расстояние свайпа влево
    const isRightSwipe = distance < -50; // Минимальное расстояние свайпа вправо
    
    if (isLeftSwipe && currentIndex < matches.length - 1) {
      // Свайп влево - переход к следующей карточке
      navigateToIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      // Свайп вправо - переход к предыдущей карточке
      navigateToIndex(currentIndex - 1);
    }
  };
  
  // Функция для навигации к определенному индексу с анимацией
  const navigateToIndex = (index) => {
    if (isAnimating || index === currentIndex) return;
    
    setIsAnimating(true);
    if (cardRef.current) {
      if (index > currentIndex) {
        cardRef.current.classList.add('swiping-left');
      } else if (index < currentIndex) {
        cardRef.current.classList.add('swiping-right');
      }
    }
    
    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.classList.remove('swiping-left', 'swiping-right');
        }
        setIsAnimating(false);
      }, 300);
    }, 100);
  };
  
  // Обработчики событий касания
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    handleSwipe();
  };
  
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
            bottom: 2rem;
            background: none;
            border: none;
            font-size: 1rem;
            color: var(--tg-theme-button-color, #2481cc);
            cursor: pointer;
            padding: 0.5rem 1.5rem;
            border-radius: 20px;
            background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          }
        `}</style>
      </div>
    );
  }
  
  const currentMatch = matches[currentIndex];
  
  return (
    <div className="match-swiper-container">
      <div className="content-wrapper">
        {/* Индикаторы прогресса (Page Controls) */}
        <div 
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
            padding: '0 10px',
            marginTop: '20px'
          }}
        >
          {Array.from({ length: matches.length }).map((_, index) => (
            <div
              key={index}
              onClick={() => {
                if (isAnimating) return;
                
                // Используем общую функцию для навигации
                navigateToIndex(index);
              }}
              style={{
                height: '4px',
                flex: 1,
                maxWidth: '40px',
                background: 
                  index === currentIndex 
                    ? 'linear-gradient(90deg, #FF6B6B, #FF4D8D)' 
                    : index < currentIndex 
                      ? 'linear-gradient(90deg, #8A2BE2, #9C27B0)' 
                      : '#E0E0E0',
                borderRadius: '2px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                opacity: index === currentIndex ? 1 : index < currentIndex ? 0.8 : 0.5,
                transform: index === currentIndex ? 'scaleY(1.2)' : 'scaleY(1)',
                transformOrigin: 'center',
                boxShadow: index === currentIndex ? '0 1px 3px rgba(255, 77, 141, 0.3)' : 'none'
              }}
            />
          ))}
        </div>
        
        <div 
          className="match-card" 
          ref={cardRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
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
            {/* Проверяем совпадение ответов для всех типов карточек */}
            {currentMatch.userAnswer === 'yes' && currentMatch.partnerAnswer === 'yes' ? (
              <div className="match-special-message">
                <span>Вы оба этого хотите! Не стоит откладывать ❤️</span>
              </div>
            ) : currentMatch.userAnswer === 'maybe' && currentMatch.partnerAnswer === 'maybe' ? (
              <div className="match-special-message">
                <span>Вы оба сомневаетесь. Обсудите это вместе!</span>
              </div>
            ) : currentMatch.type === 'regular' ? (
              <div className="match-regular-info">
                <span className="user-answer">{getAnswerText(currentMatch.userAnswer)}</span>
                <span className="partner-answer">{getAnswerText(currentMatch.partnerAnswer)}</span>
              </div>
            ) : (
              <div className="match-role-info">
                {currentMatch.userRole === 'giver' ? (
                  <>
                    <span className="user-role">Хотите дать: {getAnswerText(currentMatch.userAnswer)}</span>
                    <span className="partner-role">Хочет получить: {getAnswerText(currentMatch.partnerAnswer)}</span>
                  </>
                ) : (
                  <>
                    <span className="user-role">Хотите получить: {getAnswerText(currentMatch.userAnswer)}</span>
                    <span className="partner-role">Хочет дать: {getAnswerText(currentMatch.partnerAnswer)}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <button className="close-button" onClick={onClose}>
        Закрыть
      </button>
      
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
        
        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 500px;
        }
        
        .close-button {
          position: absolute;
          bottom: 2rem;
          background: none;
          border: none;
          font-size: 1rem;
          color: var(--tg-theme-button-color, #2481cc);
          cursor: pointer;
          padding: 0.5rem 1.5rem;
          border-radius: 20px;
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
        }
        
        .match-card {
          width: 100%;
          max-width: 500px;
          padding: 2rem;
          border-radius: 16px;
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          display: flex;
          flex-direction: column;
          height: 320px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: auto;
        }
        
        .match-question {
          font-size: 1.4rem;
          font-weight: 500;
          text-align: center;
          line-height: 1.4;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 0.5rem;
        }
        
        .match-answer {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          color: var(--tg-theme-button-color, #2481cc);
          margin: 0.5rem 0;
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
        
        .match-special-message {
          text-align: center;
          font-size: 1.1rem;
          color: #FF4D8D;
          font-weight: 500;
          padding: 0.5rem 0;
        }
        
        .user-answer, .user-role {
          color: var(--tg-theme-button-color, #2481cc);
        }
        
        .partner-answer, .partner-role {
          color: #9c27b0;
        }
      `}</style>
    </div>
  );
} 