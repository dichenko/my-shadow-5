import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useUser } from '../../utils/context';
import { useQueryClient } from '@tanstack/react-query';
import { setupBackButton, setupHeader } from '../../utils/telegram';

export default function BlockQuestions() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const [block, setBlock] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [hearts, setHearts] = useState([]);
  const questionCardRef = useRef(null);

  // Настраиваем кнопку "Назад" и заголовок Telegram WebApp
  useEffect(() => {
    // Показываем кнопку "Назад" и устанавливаем обработчик
    setupBackButton(true, () => {
      // Инвалидируем кэш для обновления счетчиков
      queryClient.invalidateQueries(['blocks-with-questions']);
      // При нажатии на кнопку "Назад" возвращаемся на страницу вопросов
      router.push('/questions');
    });
    
    // Устанавливаем заголовок, если блок загружен
    if (block) {
      setupHeader({ title: block.name });
    }
    
    // При размонтировании компонента скрываем кнопку "Назад"
    return () => {
      setupBackButton(false);
      setupHeader({ title: 'MyShadow' });
    };
  }, [router, block, queryClient]);

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
        
        // Устанавливаем заголовок после получения данных о блоке
        setupHeader({ title: blockData.name });
        
        // Получаем вопросы блока, исключая те, на которые пользователь уже ответил
        let url = `/api/questions?blockId=${id}`;
        if (user && user.id) {
          url += `&userId=${user.id}`;
        } else if (user && user.tgId) {
          url += `&userId=${user.tgId}`;
        }
        
        const questionsResponse = await fetch(url);
        if (!questionsResponse.ok) {
          throw new Error('Не удалось загрузить вопросы блока');
        }
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
        
        // Если нет вопросов, на которые пользователь еще не ответил, показываем сообщение
        if (questionsData.length === 0) {
          setError('Вы уже ответили на все вопросы в этом блоке');
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных блока:', err);
        setError(err.message || 'Произошла ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    }

    fetchBlockData();
  }, [id, user]);

  // Функция для предварительной подготовки следующего вопроса
  const prepareNextQuestion = () => {
    if (questions.length > 0 && currentQuestionIndex < questions.length - 1) {
      // Предварительно загружаем следующий вопрос в кэш браузера
      const nextQuestion = questions[currentQuestionIndex + 1];
      if (nextQuestion && nextQuestion.text) {
        // Создаем невидимый элемент для предзагрузки текста
        const preloadDiv = document.createElement('div');
        preloadDiv.style.position = 'absolute';
        preloadDiv.style.opacity = '0';
        preloadDiv.style.pointerEvents = 'none';
        preloadDiv.innerText = nextQuestion.text;
        document.body.appendChild(preloadDiv);
        
        // Удаляем элемент после короткой задержки
        setTimeout(() => {
          document.body.removeChild(preloadDiv);
        }, 100);
      }
    }
  };

  // Вызываем предзагрузку при изменении текущего вопроса
  useEffect(() => {
    prepareNextQuestion();
  }, [currentQuestionIndex, questions]);

  // Функция для создания анимации сердечек
  const createHearts = () => {
    const newHearts = [];
    const colors = ['#ff5e5e', '#ff8a8a', '#ffb6b6', '#ff0000', '#ffcece'];
    
    for (let i = 0; i < 15; i++) {
      newHearts.push({
        id: i,
        left: Math.random() * 100,
        size: Math.random() * 20 + 10,
        animationDuration: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setHearts(newHearts);
  };

  // Функция для отправки ответа
  const submitAnswer = async (answer) => {
    if (!user || !questions.length || submitting) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Определяем, какой ID использовать: внутренний ID базы данных или Telegram ID
      const userId = user.dbId || user.id;
      
      // Сохраняем текущий индекс вопроса и общее количество вопросов
      const isLastQuestion = currentQuestionIndex >= questions.length - 1;
      
      // Запускаем анимацию исчезновения текущего вопроса
      setFadeOut(true);
      
      // Ждем завершения анимации перед переходом к следующему вопросу
      setTimeout(() => {
        // Если это последний вопрос, показываем сообщение о завершении
        if (isLastQuestion) {
          setShowCompletionMessage(true);
          createHearts(); // Создаем анимацию сердечек
          
          // Через 2.5 секунды переходим на главную страницу
          setTimeout(() => {
            router.push('/questions');
          }, 2500);
        } else {
          // Иначе переходим к следующему вопросу
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          // Запускаем анимацию появления нового вопроса
          setFadeOut(false);
        }
      }, 150); // Время анимации исчезновения
      
      // Отправляем запрос на сервер асинхронно
      const saveAnswerPromise = (async () => {
        console.log('Отправка ответа:', {
          questionId: currentQuestion.id,
          userId: userId,
          userType: user.dbId ? 'dbId' : 'telegramId',
          text: answer
        });
        
        const response = await fetch('/api/answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            userId: userId,
            text: answer, // "yes", "no", "maybe"
          }),
        });
        
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Ошибка при парсинге ответа:', parseError);
          throw new Error('Ошибка при получении ответа от сервера');
        }
        
        if (!response.ok) {
          console.error('Ошибка при отправке ответа. Статус:', response.status, 'Ответ:', data);
          throw new Error(data.error || 'Не удалось сохранить ответ');
        }
        
        console.log('Ответ успешно сохранен:', data);
        return data;
      })();
      
      // Обрабатываем результат запроса в фоновом режиме
      saveAnswerPromise
        .then(() => {
          // Инвалидируем кэш для обновления счетчика ответов в фоновом режиме
          return queryClient.invalidateQueries(['blocks-with-questions']);
        })
        .catch(err => {
          console.error('Ошибка при отправке ответа:', err);
          // В случае ошибки возвращаем предыдущий вопрос
          if (!isLastQuestion) {
            setFadeOut(true);
            setTimeout(() => {
              setCurrentQuestionIndex(currentQuestionIndex);
              setFadeOut(false);
            }, 150);
          } else {
            setShowCompletionMessage(false); // Скрываем сообщение о завершении
          }
          setError(err.message || 'Не удалось сохранить ответ. Пожалуйста, попробуйте еще раз.');
          setSubmitting(false);
        });
        
      // Устанавливаем таймаут для сброса состояния submitting, даже если запрос еще не завершен
      setTimeout(() => {
        setSubmitting(false);
      }, 300); // Немного больше времени, чем анимация, чтобы избежать мерцания кнопок
      
    } catch (err) {
      console.error('Ошибка при подготовке отправки ответа:', err);
      setError(err.message || 'Не удалось сохранить ответ. Пожалуйста, попробуйте еще раз.');
      setSubmitting(false);
    }
  };

  // Показываем загрузку, если данные еще не получены
  const isLoading = loading;
  
  // Если нет вопросов, на которые пользователь еще не ответил
  const noQuestionsLeft = !isLoading && questions.length === 0;
  
  // Проверяем, что индекс текущего вопроса находится в пределах массива
  const isValidIndex = currentQuestionIndex >= 0 && currentQuestionIndex < questions.length;
  
  // Обновляем определение текущего вопроса с проверкой валидности индекса
  const currentQuestion = isValidIndex ? questions[currentQuestionIndex] : null;
  
  // Если индекс вышел за пределы массива, сбрасываем его на 0
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex >= questions.length) {
      setCurrentQuestionIndex(0);
    }
  }, [questions, currentQuestionIndex]);

  return (
    <div className="container">
      <Head>
        <title>{block ? `${block.name} | MyShadowApp` : 'Блок вопросов | MyShadowApp'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Вопросы блока в MyShadowApp" />
      </Head>

      <div className="back-button">
        <Link href="/questions" legacyBehavior>
          <a className="back-button-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </Link>
      </div>

      {questions.length > 0 && !showCompletionMessage && (
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
        ) : showCompletionMessage ? (
          <div className="completion-container">
            <div className="completion-card">
              <h2>Поздравляем!</h2>
              <p>Вы ответили на все вопросы в этом блоке</p>
              {hearts.map(heart => (
                <div 
                  key={heart.id}
                  className="heart"
                  style={{
                    left: `${heart.left}%`,
                    width: `${heart.size}px`,
                    height: `${heart.size}px`,
                    backgroundColor: heart.color,
                    animationDuration: `${heart.animationDuration}s`
                  }}
                />
              ))}
            </div>
          </div>
        ) : !currentQuestion ? (
          <div className="error">Вопрос не найден. Пожалуйста, вернитесь к списку блоков.</div>
        ) : (
          <div className="question-container">
            <div 
              ref={questionCardRef}
              className={`question-card ${fadeOut ? 'fade-out' : 'fade-in'}`}
            >
              <p className="question-text">{currentQuestion.text}</p>
            </div>
            
            <div className="answer-buttons">
              <button 
                className="btn btn-want"
                onClick={() => submitAnswer('yes')}
                disabled={submitting || fadeOut}
              >
                ХОЧУ
              </button>
              
              <button 
                className="btn btn-dont-want"
                onClick={() => submitAnswer('no')}
                disabled={submitting || fadeOut}
              >
                НЕ ХОЧУ
              </button>
              
              <button 
                className="btn btn-maybe"
                onClick={() => submitAnswer('maybe')}
                disabled={submitting || fadeOut}
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
          transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
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
        
        .fade-out {
          opacity: 0;
          transform: translateY(-10px);
        }
        
        .fade-in {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Стили для экрана завершения */
        .completion-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 500px;
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .completion-card {
          background-color: #f5f5f5;
          border-radius: 12px;
          padding: 2rem;
          width: 100%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .completion-card h2 {
          margin-top: 0;
          color: var(--tg-theme-button-color, #2481cc);
          font-size: 1.5rem;
        }
        
        .completion-card p {
          font-size: 1.1rem;
          margin-bottom: 0;
        }
        
        .heart {
          position: absolute;
          transform: rotate(45deg);
          opacity: 0;
          animation: floatHeart 3s ease-in-out forwards;
        }
        
        .heart:before,
        .heart:after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: inherit;
        }
        
        .heart:before {
          top: -50%;
          left: 0;
        }
        
        .heart:after {
          top: 0;
          left: -50%;
        }
        
        @keyframes floatHeart {
          0% {
            transform: rotate(45deg) translateY(0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: rotate(45deg) translateY(-100vh) scale(1);
            opacity: 0;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
} 