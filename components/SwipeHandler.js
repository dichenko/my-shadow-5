import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SwipeHandler({ children }) {
  // Навигация по свайпу отключена
  // Оставляем компонент для совместимости с существующим кодом
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
} 