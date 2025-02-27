import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SwipeHandler({ children }) {
  const router = useRouter();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Минимальное расстояние свайпа для срабатывания (в пикселях)
  const minSwipeDistance = 50;

  // Порядок страниц для навигации
  const pageOrder = ['/questions', '/pair', '/settings'];

  useEffect(() => {
    const onTouchStart = (e) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      // Получаем текущий индекс страницы
      const currentPageIndex = pageOrder.indexOf(router.pathname);
      
      if (isLeftSwipe && currentPageIndex < pageOrder.length - 1) {
        // Свайп влево - переход на следующую страницу
        router.push(pageOrder[currentPageIndex + 1]);
      } else if (isRightSwipe && currentPageIndex > 0) {
        // Свайп вправо - переход на предыдущую страницу
        router.push(pageOrder[currentPageIndex - 1]);
      }
    };

    // Добавляем обработчики событий
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);

    // Удаляем обработчики при размонтировании компонента
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [touchStart, touchEnd, router]);

  return <>{children}</>;
} 