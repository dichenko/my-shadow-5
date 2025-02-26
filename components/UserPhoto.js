import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '../utils/context';

export default function UserPhoto() {
  const { user, photoUrl } = useUser();
  const [error, setError] = useState(false);

  // Функция для генерации аватара на основе имени пользователя
  const getAvatarUrl = (user) => {
    if (!user) return null;
    return `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name || ''}&background=random&color=fff&size=128`;
  };

  const handleImageError = () => {
    setError(true);
  };

  const displayUrl = error || !photoUrl ? getAvatarUrl(user) : photoUrl;

  return (
    <div className="user-photo">
      <Link href="/profile">
        {user ? (
          <img 
            src={displayUrl} 
            alt={`${user.first_name} ${user.last_name || ''}`}
            onError={handleImageError}
          />
        ) : (
          <div className="photo-placeholder"></div>
        )}
      </Link>

      <style jsx>{`
        .user-photo {
          position: absolute;
          top: 1rem;
          right: 1rem;
          z-index: 10;
          width: 40px;
          height: 40px;
        }
        
        .user-photo img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid var(--tg-theme-button-color, #2481cc);
          transition: all 0.3s ease;
          object-fit: cover;
        }
        
        .user-photo img:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }
        
        .photo-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          border: 2px solid var(--tg-theme-button-color, #2481cc);
        }
      `}</style>
    </div>
  );
} 