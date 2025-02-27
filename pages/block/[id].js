import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useUser } from '../../utils/context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBlock, fetchQuestions, submitAnswer } from '../../utils/api';

export default function BlockQuestions() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Получаем информацию о блоке с использованием React Query
  const { 
    data: block, 
    isLoading: blockLoading,
    error: blockError
  } = useQuery({
    queryKey: ['block', id],
    queryFn: () => fetchBlock(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });

  // Получаем вопросы блока с использованием React Query
  const { 
    data: questions = [], 
    isLoading: questionsLoading,
    error: questionsError
  } = useQuery({
    queryKey: ['questions', id, user?.id || user?.tgId],
    queryFn: () => fetchQuestions(id, user?.id || user?.tgId),
    enabled: !!id && !!user,
    staleTime: 10 * 60 * 1000,
  });

  // Мутация для отправки ответа
  const answerMutation = useMutation({
    mutationFn: submitAnswer,
    onSuccess: () => {
      // При успешной отправке ответа инвалидируем кэш вопросов
      queryClient.invalidateQueries({ queryKey: ['questions', id, user?.id || user?.tgId] });
      // Также инвалидируем кэш блоков с вопросами, чтобы обновить прогресс
      queryClient.invalidateQueries({ queryKey: ['blocks-with-questions', user?.id || user?.tgId] });
    },
  });

  // Обрабатываем ошибки загрузки
  useEffect(() => {
    if (blockError) {
      setError('Не удалось загрузить информацию о блоке');
      console.error('Ошибка при загрузке блока:', blockError);
    }
    if (questionsError) {
      setError('Не удалось загрузить вопросы блока');
      console.error('Ошибка при загрузке вопросов:', questionsError);
    }
  }, [blockError, questionsError]);

  // Функция для отправки ответа
  const handleSubmitAnswer = async (answer) => {
    if (!user || !questions.length || submitting) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Определяем, какой ID использовать: внутренний ID базы данных или Telegram ID
      const userId = user.dbId || user.id;
      
      console.log('Отправка ответа:', {
        questionId: currentQuestion.id,
        userId: userId,
        userType: user.dbId ? 'dbId' : 'telegramId',
        text: answer
      });
      
      // Используем мутацию для отправки ответа
      await answerMutation.mutateAsync({
        questionId: currentQuestion.id,
        userId: userId,
        text: answer, // "yes", "no", "maybe"
      });
      
      // Переходим к следующему вопросу или завершаем
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Если это был последний вопрос, показываем сообщение об успешном завершении
        setError('Вы ответили на все вопросы в этом блоке');
      }
    } catch (err) {
      console.error('Ошибка при отправке ответа:', err);
      setError(err.message || 'Произошла ошибка при отправке ответа');
    } finally {
      setSubmitting(false);
    }
  };

  // Предзагрузка следующего блока, если есть
  useEffect(() => {
    if (block && block.nextBlockId) {
      // Предзагружаем следующий блок
      queryClient.prefetchQuery({
        queryKey: ['block', block.nextBlockId],
        queryFn: () => fetchBlock(block.nextBlockId),
      });
      
      // Предзагружаем вопросы следующего блока
      queryClient.prefetchQuery({
        queryKey: ['questions', block.nextBlockId, user?.id || user?.tgId],
        queryFn: () => fetchQuestions(block.nextBlockId, user?.id || user?.tgId),
        enabled: !!user,
      });
    }
  }, [block, user, queryClient]);

  // Показываем загрузку, если данные еще не получены
  const isLoading = blockLoading || questionsLoading;
  
  // Если нет вопросов, на которые пользователь еще не ответил
  const noQuestionsLeft = !isLoading && questions.length === 0;
  
  // Текущий вопрос
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container">
      <Head>
        <title>{block ? `${block.name} | MyShadowApp` : 'Блок вопросов | MyShadowApp'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Вопросы блока в MyShadowApp" />
      </Head>

      <div className="back-button">
        <Link href="/questions">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {questions.length > 0 && (
        <div className="question-counter">
          {currentQuestionIndex + 1}/{questions.length}
        </div>
      )}

      <main className="main">
        {isLoading ? (
          <div className="loading">Загрузка вопросов...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : noQuestionsLeft ? (
          <div className="empty-state">
            <p>В этом блоке пока нет вопросов</p>
          </div>
        ) : (
          <div className="question-container">
            <div className="question-card">
              <p className="question-text">{currentQuestion.text}</p>
            </div>
            
            <div className="answer-buttons">
              <button 
                className="btn btn-want"
                onClick={() => handleSubmitAnswer('yes')}
                disabled={submitting}
              >
                ХОЧУ
              </button>
              
              <button 
                className="btn btn-dont-want"
                onClick={() => handleSubmitAnswer('no')}
                disabled={submitting}
              >
                НЕ ХОЧУ
              </button>
              
              <button 
                className="btn btn-maybe"
                onClick={() => handleSubmitAnswer('maybe')}
                disabled={submitting}
              >
                сомневаюсь
              </button>
            </div>
          </div>
        )}
      </main>

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
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
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
        }
        
        .question-counter {
          position: absolute;
          top: 1rem;
          right: 1rem;
          font-size: 1rem;
          color: var(--tg-theme-hint-color, #999999);
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
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
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .question-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 500px;
        }
        
        .question-card {
          background-color: #f5f5f5;
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          width: 100%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        
        .question-text {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
          font-weight: 500;
        }
        
        .answer-buttons {
          display: flex;
          flex-direction: column;
          width: 100%;
          gap: 1rem;
        }
        
        .btn {
          padding: 1rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        
        .btn:active {
          transform: scale(0.98);
        }
        
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .btn-want {
          background-color: #e0e0e0;
          color: #000000;
          font-size: 1.2rem;
        }
        
        .btn-dont-want {
          background-color: #e0e0e0;
          color: #000000;
          font-size: 1.2rem;
        }
        
        .btn-maybe {
          background-color: transparent;
          color: var(--tg-theme-hint-color, #999999);
          font-size: 0.9rem;
          font-weight: normal;
        }
      `}</style>
    </div>
  );
} 