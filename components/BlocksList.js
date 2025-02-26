import { useState } from 'react';
import Link from 'next/link';

export default function BlocksList({ blocks = [] }) {
  // Массив градиентов для блоков
  const gradients = [
    'linear-gradient(135deg, #FF6B8B 0%, #FF8E9E 100%)',
    'linear-gradient(135deg, #4A90E2 0%, #6BA5E7 100%)',
    'linear-gradient(135deg, #9B6B9E 0%, #B37FB6 100%)',
    'linear-gradient(135deg, #FFB347 0%, #FFCC33 100%)',
    'linear-gradient(135deg, #66BB6A 0%, #98EE99 100%)'
  ];

  return (
    <div className="blocks-container">
      <div className="header">
        <h1>Let's Play</h1>
        <p>Be the first!</p>
      </div>
      
      {blocks.length === 0 ? (
        <div className="empty-state">
          <p>Блоки вопросов не найдены</p>
        </div>
      ) : (
        <div className="blocks-list">
          {blocks.map((block, index) => (
            <Link href={`/block/${block.id}`} key={block.id} className="block-card" style={{
              background: gradients[index % gradients.length]
            }}>
              <div className="block-content">
                <div className="block-info">
                  <h3 className="block-name">{block.name}</h3>
                  <span className="block-questions-count">{block.questionsCount || 0} вопросов</span>
                </div>
                <div className="block-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .blocks-container {
          padding: 1.5rem;
          padding-bottom: 5rem;
        }
        
        .header {
          margin-bottom: 2rem;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: bold;
          color: #FF6B8B;
          margin-bottom: 0.5rem;
        }

        .header p {
          font-size: 1rem;
          color: var(--tg-theme-hint-color);
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--tg-theme-hint-color);
        }
        
        .blocks-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .block-card {
          padding: 1.5rem;
          border-radius: 20px;
          text-decoration: none;
          color: white;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .block-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .block-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .block-info {
          flex: 1;
        }
        
        .block-name {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }
        
        .block-questions-count {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        
        .block-arrow {
          margin-left: 1rem;
        }
        
        @media (min-width: 640px) {
          .blocks-list {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 1024px) {
          .blocks-list {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
} 