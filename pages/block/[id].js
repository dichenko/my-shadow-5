import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import UserPhoto from '../../components/UserPhoto';
import BottomMenu from '../../components/BottomMenu';

export default function BlockQuestions() {
  const router = useRouter();
  const { id } = router.query;
  
  const [block, setBlock] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBlockData() {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Получаем информацию о блоке
        const blockResponse = await fetch(`/api/blocks?id=${id}`);
        if (!blockResponse.ok) {
          throw new Error('Не удалось загрузить информацию о блоке');
        }
        const blockData = await blockResponse.json();
        setBlock(blockData);
        
        // Получаем вопросы блока
        const questionsResponse = await fetch(`/api/questions?blockId=${id}`);
        if (!questionsResponse.ok) {
          throw new Error('Не удалось загрузить вопросы блока');
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
      } catch (err) {
        console.error('Ошибка при загрузке данных блока:', err);
        setError(err.message || 'Произошла ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    }

    fetchBlockData();
  }, [id]);

  return (
    <div className="container">
      <Head>
        <title>{block ? `${block.name} | MyShadowApp` : 'Блок вопросов | MyShadowApp'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Вопросы блока в MyShadowApp" />
      </Head>

      <UserPhoto />

      <div className="back-button">
        <Link href="/questions">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Назад</span>
        </Link>
      </div>

      <main className="main">
        {loading ? (
          <div className="loading">Загрузка вопросов...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="block-content">
            <h1 className="block-title">{block?.name}</h1>
            
            {questions.length === 0 ? (
              <div className="empty-state">
                <p>В этом блоке пока нет вопросов</p>
              </div>
            ) : (
              <div className="questions-list">
                {questions.map((question) => (
                  <div key={question.id} className="question-card">
                    <p className="question-text">{question.text}</p>
                    <div className="question-meta">
                      <span className="question-role">Роль: {question.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <BottomMenu activePage="questions" />

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0;
          display: flex;
          flex-direction: column;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
          position: relative;
        }
        
        .main {
          flex: 1;
          padding-top: 4rem;
          padding-bottom: 4rem;
        }
        
        .back-button {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 10;
        }
        
        .back-button a {
          display: flex;
          align-items: center;
          color: var(--tg-theme-button-color, #2481cc);
          text-decoration: none;
          font-size: 0.875rem;
        }
        
        .back-button svg {
          margin-right: 0.25rem;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 50vh;
          font-size: 1.2rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .error {
          padding: 2rem;
          text-align: center;
          color: var(--tg-theme-destructive-text-color, #ff0000);
        }
        
        .block-content {
          padding: 1rem;
        }
        
        .block-title {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .question-card {
          padding: 1rem;
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .question-text {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
          line-height: 1.5;
        }
        
        .question-meta {
          font-size: 0.75rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .question-role {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background-color: var(--tg-theme-bg-color, #ffffff);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 