import Link from 'next/link';

export default function BlocksList({ blocks = [] }) {
  // Массив градиентов для блоков в минималистичном стиле
  const gradients = [
    'linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 100%)',
    'linear-gradient(135deg, #D4D4D4 0%, #E8E8E8 100%)',
    'linear-gradient(135deg, #CCCCCC 0%, #E0E0E0 100%)',
    'linear-gradient(135deg, #C4C4C4 0%, #D8D8D8 100%)',
    'linear-gradient(135deg, #BCBCBC 0%, #D0D0D0 100%)'
  ];

  return (
    <div className="blocks-container">      
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
                  <span className="block-questions-count">
                    {block.questionsCount || 0} вопросов
                    {block.answeredCount !== undefined && (
                      <span className="block-progress"> • Отвечено: {block.answeredCount}/{block.questionsCount}</span>
                    )}
                  </span>
                  {block.answeredCount !== undefined && block.questionsCount > 0 && (
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${(block.answeredCount / block.questionsCount) * 100}%` 
                        }}
                      ></div>
                    </div>
                  )}
                </div>
                <div className="block-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          padding: 1rem;
          padding-bottom: 5rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--tg-theme-hint-color);
        }
        
        .blocks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .block-card {
          padding: 1.25rem;
          border-radius: 12px;
          text-decoration: none;
          color: var(--tg-theme-text-color);
          transition: transform 0.2s;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .block-card:active {
          transform: scale(0.98);
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
          font-size: 1.1rem;
          font-weight: 500;
          margin: 0 0 0.25rem 0;
        }
        
        .block-questions-count {
          font-size: 0.875rem;
          color: var(--tg-theme-hint-color);
        }
        
        .block-progress {
          font-size: 0.875rem;
          color: var(--tg-theme-hint-color);
        }
        
        .progress-bar-container {
          height: 4px;
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 2px;
          margin-top: 0.5rem;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #6b66ff, #ff6b6b);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        
        .block-arrow {
          margin-left: 1rem;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
} 