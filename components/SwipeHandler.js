import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SwipeHandler({ children }) {
  const router = useRouter();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Минимальное расстояние свайпа для срабатывания (в пикселях)
  const minSwipeDistance = 50;
  
  // Порядок страниц для навигации
  const pageOrder = ['/questions', '/pair', '/settings'];
  
  // Обработчики событий касания
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isAnimating) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (!isLeftSwipe && !isRightSwipe) return;
    
    const currentPageIndex = pageOrder.indexOf(router.pathname);
    if (currentPageIndex === -1) return;
    
    let nextPage = null;
    
    if (isLeftSwipe && currentPageIndex < pageOrder.length - 1) {
      // Свайп влево - переход на следующую страницу
      nextPage = pageOrder[currentPageIndex + 1];
    } else if (isRightSwipe && currentPageIndex > 0) {
      // Свайп вправо - переход на предыдущую страницу
      nextPage = pageOrder[currentPageIndex - 1];
    }
    
    if (nextPage) {
      setIsAnimating(true);
      
      // Добавляем класс для анимации перехода
      document.body.classList.add(isLeftSwipe ? 'swiping-left' : 'swiping-right');
      
      // Переходим на новую страницу после небольшой задержки для анимации
      setTimeout(() => {
        router.push(nextPage);
        
        // Удаляем класс анимации
        setTimeout(() => {
          document.body.classList.remove('swiping-left', 'swiping-right');
          setIsAnimating(false);
        }, 300);
      }, 100);
    }
  };
  
  // Добавляем глобальные стили для анимации свайпа
  useEffect(() => {
    // Создаем элемент стиля
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      body.swiping-left .container {
        animation: swipeLeft 0.3s ease-out;
      }
      
      body.swiping-right .container {
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
  
  return (
    <div 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </div>
  );
} 