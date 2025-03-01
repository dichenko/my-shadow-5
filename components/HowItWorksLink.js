import { useState } from 'react';
import Onboarding from './Onboarding';

export default function HowItWorksLink() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const openOnboarding = () => {
    setShowOnboarding(true);
  };
  
  const closeOnboarding = () => {
    setShowOnboarding(false);
  };
  
  return (
    <>
      <div className="how-it-works-link" onClick={openOnboarding}>
        Как это работает?
      </div>
      
      {showOnboarding && <Onboarding onComplete={closeOnboarding} />}
      
      <style jsx>{`
        .how-it-works-link {
          text-align: center;
          margin-top: 1rem;
          padding: 0.5rem;
          color: var(--tg-theme-link-color, var(--app-primary));
          font-size: 0.9rem;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
        
        .how-it-works-link:hover {
          opacity: 1;
          text-decoration: underline;
        }
      `}</style>
    </>
  );
} 