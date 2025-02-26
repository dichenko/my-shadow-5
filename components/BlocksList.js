import { useState } from 'react';
import Link from 'next/link';

export default function BlocksList({ blocks = [] }) {
  return (
    <div className="blocks-container">
      <h2 className="blocks-title">Блоки вопросов</h2>
      
      {blocks.length === 0 ? (
        <div className="empty-state">
          <p>Блоки вопросов не найдены</p>
        </div>
      ) : (
        <div className="blocks-grid">
          {blocks.map((block) => (
            <Link href={`/block/${block.id}`} key={block.id} className="block-card">
              <div className="block-content">
                <h3 className="block-name">{block.name}</h3>
                <div className="block-info">
                  <span className="block-questions-count">{block.questionsCount || 0} вопросов</span>
                </div>
              </div>
              <div className="block-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .blocks-container {
          padding: 1rem;
          margin-bottom: 4rem; /* Для нижнего меню */
        }
        
        .blocks-title {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          color: var(--tg-theme-text-color, #000000);
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .blocks-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .block-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          border-radius: 8px;
          text-decoration: none;
          color: var(--tg-theme-text-color, #000000);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .block-card:hover, .block-card:active {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .block-content {
          flex: 1;
        }
        
        .block-name {
          font-size: 1.2rem;
          margin: 0 0 0.5rem 0;
        }
        
        .block-info {
          font-size: 0.875rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .block-arrow {
          color: var(--tg-theme-hint-color, #999999);
        }
        
        @media (min-width: 640px) {
          .blocks-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1024px) {
          .blocks-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
} 