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
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const questionCardRef = useRef(null);
  
  // Добавляем состояние для времени охлаждения
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(100);
  const cooldownTime = 2500; // 2.5 секунды охлаждения
  const cooldownIntervalRef = useRef(null);

  // Добавляем состояния для обработки свайпа
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);

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
        
        // Получаем все вопросы блока для подсчета общего количества
        const allQuestionsResponse = await fetch(`/api/questions?blockId=${id}&includeAll=true`);
        if (!allQuestionsResponse.ok) {
          throw new Error('Не удалось загрузить все вопросы блока');
        }
        const allQuestionsData = await allQuestionsResponse.json();
        setTotalQuestions(allQuestionsData.length);
        
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
        if (questionsData.length === 0 && allQuestionsData.length > 0) {
          setAllQuestionsAnswered(true);
          createHearts(); // Создаем анимацию сердечек
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

  // Функция для запуска времени охлаждения
  const startCooldown = () => {
    setIsCooldown(true);
    setCooldownProgress(100);
    
    // Создаем интервал для обновления прогресса
    const startTime = Date.now();
    const intervalTime = 50; // Обновляем каждые 50мс для плавной анимации
    
    // Очищаем предыдущий интервал, если он существует
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
    }
    
    cooldownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = 100 - (elapsed / cooldownTime) * 100;
      
      if (progress <= 0) {
        // Завершаем охлаждение
        clearInterval(cooldownIntervalRef.current);
        setCooldownProgress(0);
        setIsCooldown(false);
      } else {
        setCooldownProgress(progress);
      }
    }, intervalTime);
  };
  
  // Останавливаем интервал при размонтировании компонента
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Функция для отправки ответа
  const submitAnswer = async (answer) => {
    if (!user || !questions.length || submitting || isCooldown) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Запускаем время охлаждения
      startCooldown();
      
      // Определяем, какой ID использовать: внутренний ID базы данных или Telegram ID
      const userId = user.dbId || user.id;
      
      // Создаем копию массива вопросов для обновления
      const updatedQuestions = [...questions];
      const answeredQuestionIndex = currentQuestionIndex;
      
      // Определяем следующий индекс до удаления вопроса
      let nextIndex = currentQuestionIndex;
      if (updatedQuestions.length > 1) {
        // Если это последний вопрос, переходим к первому, иначе к следующему
        nextIndex = currentQuestionIndex >= updatedQuestions.length - 1 ? 0 : currentQuestionIndex + 1;
      }
      
      // Запускаем анимацию исчезновения текущего вопроса
      setFadeOut(true);
      
      // Подготавливаем данные для отправки на сервер
      const answerData = {
        questionId: currentQuestion.id,
        userId: userId,
        text: answer // "yes", "no", "maybe"
      };
      
      // Немедленно обновляем UI, не дожидаясь ответа сервера
      // Удаляем отвеченный вопрос из списка
      updatedQuestions.splice(answeredQuestionIndex, 1);
      
      // Запускаем отправку ответа на сервер в фоновом режиме
      fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData),
      })
      .then(async (response) => {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('Ошибка при парсинге ответа:', parseError);
          return;
        }
        
        if (!response.ok) {
          console.error('Ошибка при отправке ответа. Статус:', response.status, 'Ответ:', data);
          return;
        }
        
        console.log('Ответ успешно сохранен:', data);
        
        // Инвалидируем кэш для обновления счетчика ответов
        queryClient.invalidateQueries(['blocks-with-questions']);
      })
      .catch(err => {
        console.error('Ошибка при отправке ответа:', err);
        // Ошибка при отправке не должна влиять на UX, просто логируем
      })
      .finally(() => {
        setSubmitting(false);
      });
      
      // Немедленно обновляем UI, не дожидаясь завершения запроса
      // Если это был последний вопрос, показываем сообщение о завершении
      if (updatedQuestions.length === 0) {
        // Минимальная задержка для анимации исчезновения
        setTimeout(() => {
          setShowCompletionMessage(true);
          createHearts(); // Создаем анимацию сердечек
          
          // Через 2.5 секунды переходим на главную страницу
          setTimeout(() => {
            router.push('/questions');
          }, 2500);
        }, 150); // Увеличиваем задержку, чтобы учесть время кулдауна
      } else {
        // Обновляем список вопросов, удаляя отвеченный
        setQuestions(updatedQuestions);
        
        // Корректируем индекс, если необходимо
        if (answeredQuestionIndex >= updatedQuestions.length) {
          setCurrentQuestionIndex(0);
        } else if (answeredQuestionIndex < nextIndex && nextIndex > 0) {
          // Если удаленный вопрос был перед следующим, корректируем индекс
          setCurrentQuestionIndex(nextIndex - 1);
        } else {
          setCurrentQuestionIndex(nextIndex);
        }
        
        // Задержка для анимации исчезновения (увеличена для учета времени кулдауна)
        setTimeout(() => {
          // Запускаем анимацию появления нового вопроса
          setFadeOut(false);
        }, 150);
      }
      
    } catch (err) {
      console.error('Ошибка при подготовке отправки ответа:', err);
      setError(err.message || 'Не удалось сохранить ответ. Пожалуйста, попробуйте еще раз.');
      
      // В случае ошибки отменяем анимацию исчезновения
      setFadeOut(false);
      setSubmitting(false);
    }
  };

  // Функция для сброса ответов пользователя на вопросы блока
  const resetBlockAnswers = async () => {
    if (!user || !id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Определяем, какой ID использовать: внутренний ID базы данных или Telegram ID
      const userId = user.dbId || user.id;
      
      // Отправляем запрос на удаление ответов
      const response = await fetch(`/api/delete-block-answers?userId=${userId}&blockId=${id}`, {
        method: 'DELETE',
      });
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Ошибка при парсинге ответа:', parseError);
        throw new Error('Ошибка при получении ответа от сервера');
      }
      
      if (!response.ok) {
        console.error('Ошибка при удалении ответов. Статус:', response.status, 'Ответ:', data);
        throw new Error(data.error || 'Не удалось удалить ответы');
      }
      
      console.log('Ответы успешно удалены:', data);
      
      // Инвалидируем кэш для обновления счетчика ответов
      queryClient.invalidateQueries(['blocks-with-questions']);
      
      // Перезагружаем страницу для получения новых вопросов
      router.reload();
      
    } catch (err) {
      console.error('Ошибка при удалении ответов:', err);
      setError(err.message || 'Не удалось удалить ответы. Пожалуйста, попробуйте еще раз.');
      setLoading(false);
    }
  };

  // Обработчики событий касания
  const onTouchStart = (e) => {
    // Не реагируем на касания во время охлаждения
    if (isCooldown) return;
    
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e) => {
    // Не реагируем на движения во время охлаждения
    if (isCooldown) return;
    
    setTouchEnd(e.targetTouches[0].clientX);
    
    // Добавляем индикацию свайпа
    if (touchStart && questionCardRef.current) {
      const distance = e.targetTouches[0].clientX - touchStart;
      // Показываем индикацию свайпа только если движение достаточное (> 10px)
      if (Math.abs(distance) > 10) {
        setSwiping(true);
        if (distance > 0) {
          setSwipeDirection('right');
          questionCardRef.current.classList.add('swiping-right');
          questionCardRef.current.classList.remove('swiping-left');
        } else {
          setSwipeDirection('left');
          questionCardRef.current.classList.add('swiping-left');
          questionCardRef.current.classList.remove('swiping-right');
        }
      } else {
        setSwiping(false);
        questionCardRef.current.classList.remove('swiping-left', 'swiping-right');
      }
    }
  };
  
  const onTouchEnd = () => {
    // Не реагируем на окончание касания во время охлаждения
    if (isCooldown) return;
    
    if (!touchStart || !touchEnd || submitting || fadeOut) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && questions.length > 0) {
      // Циклический переход: если текущий вопрос последний, переходим к первому
      const nextIndex = currentQuestionIndex < questions.length - 1 ? currentQuestionIndex + 1 : 0;
      setCurrentQuestionIndex(nextIndex);
    } else if (isRightSwipe && questions.length > 0) {
      // Циклический переход: если текущий вопрос первый, переходим к последнему
      const prevIndex = currentQuestionIndex > 0 ? currentQuestionIndex - 1 : questions.length - 1;
      setCurrentQuestionIndex(prevIndex);
    }
    
    setSwiping(false);
    setSwipeDirection(null);
    
    if (questionCardRef.current) {
      questionCardRef.current.classList.remove('swiping', 'swiping-right', 'swiping-left');
    }
  };

  // Показываем загрузку, если данные еще не получены
  const isLoading = loading;
  
  // Если нет вопросов, на которые пользователь еще не ответил
  const noQuestionsLeft = !isLoading && questions.length === 0 && !allQuestionsAnswered;
  
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

  // Определяем градиент для карточки вопроса на основе индекса блока
  const getBlockGradient = () => {
    // Массив градиентов для блоков в минималистичном стиле
    const gradients = [
      'linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 100%)',
      'linear-gradient(135deg, #D4D4D4 0%, #E8E8E8 100%)',
      'linear-gradient(135deg, #CCCCCC 0%, #E0E0E0 100%)',
      'linear-gradient(135deg, #C4C4C4 0%, #D8D8D8 100%)',
      'linear-gradient(135deg, #BCBCBC 0%, #D0D0D0 100%)'
    ];
    
    // Используем ID блока для выбора градиента
    return block ? gradients[(block.id - 1) % gradients.length] : gradients[0];
  };

  // Добавляем предзагрузку изображений для анимации сердечек
  useEffect(() => {
    // Предзагружаем сердечки для анимации завершения
    if (questions.length === 1) {
      createHearts();
      setTimeout(() => setHearts([]), 100); // Скрываем их после предзагрузки
    }
  }, [questions.length]);

  return (
    <div className="container">
      <Head>
        <title>{block ? `${block.name} | MyShadowApp` : 'Блок вопросов | MyShadowApp'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Вопросы блока в MyShadowApp" />
      </Head>

      <main className="main">
        {isLoading ? (
          <div className="loading">Загрузка вопросов...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : noQuestionsLeft ? (
          <div className="empty-state">
            <p>В этом блоке пока нет вопросов</p>
          </div>
        ) : allQuestionsAnswered ? (
          <div className="completion-container">
            <div className="completion-card">
              <h2>Поздравляем!</h2>
              <p>Вы ответили на все вопросы в этом блоке</p>
              <p className="completion-stats">Всего вопросов: {totalQuestions}</p>
              
              {!showConfirmReset ? (
                <div className="completion-actions">
                  <Link href="/questions" legacyBehavior>
                    <a className="btn btn-return">Вернуться</a>
                  </Link>
                  <button 
                    className="btn-reset"
                    onClick={() => setShowConfirmReset(true)}
                  >
                    Ответить заново
                  </button>
                </div>
              ) : (
                <div className="confirm-reset">
                  <p>Все ваши ответы в этом блоке будут удалены. Вы уверены?</p>
                  <div className="confirm-buttons">
                    <button 
                      className="btn btn-confirm-yes"
                      onClick={resetBlockAnswers}
                      disabled={loading}
                    >
                      Да, удалить
                    </button>
                    <button 
                      className="btn btn-confirm-no"
                      onClick={() => setShowConfirmReset(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}
              
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
            {/* Индикаторы прогресса */}
            <div className="progress-indicators">
              {Array.from({ length: questions.length }).map((_, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (fadeOut || isCooldown) return;
                    setCurrentQuestionIndex(index);
                  }}
                  className={`progress-indicator ${index === currentQuestionIndex ? 'active' : ''} ${index < currentQuestionIndex ? 'completed' : ''}`}
                />
              ))}
            </div>
            
            {/* Индикатор охлаждения */}
            {isCooldown && (
              <div className="cooldown-indicator" style={{ 
                width: `${cooldownProgress}%`,
                opacity: cooldownProgress / 100
              }}></div>
            )}
            
            <div 
              className={`question-card ${fadeOut ? 'fade-out' : 'fade-in'}`}
              ref={questionCardRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="question-text-container">
                <p className="question-text">{currentQuestion.text}</p>
              </div>
            </div>
            
            <div className="answer-buttons">
              <button 
                className="btn btn-want"
                onClick={() => submitAnswer('yes')}
                disabled={submitting || fadeOut || isCooldown}
              >
                ХОЧУ
              </button>
              
              <button 
                className="btn btn-dont-want"
                onClick={() => submitAnswer('no')}
                disabled={submitting || fadeOut || isCooldown}
              >
                НЕ ХОЧУ
              </button>
              
              <button 
                className="btn btn-maybe"
                onClick={() => submitAnswer('maybe')}
                disabled={submitting || fadeOut || isCooldown}
              >
                сомневаюсь
              </button>
            </div>

            <div className="swipe-hint">
              <p>Свайпните влево, чтобы пропустить вопрос</p>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 5L21 12M21 12L14 19M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
        
        .progress-indicators {
          display: flex;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 0 10px;
          margin-bottom: 24px;
          margin-top: 20px;
        }
        
        .progress-indicator {
          height: 4px;
          flex: 1;
          max-width: 40px;
          background-color: #E0E0E0;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
          opacity: 0.5;
        }
        
        .progress-indicator.active {
          background: linear-gradient(90deg, #FF6B6B, #FF4D8D);
          opacity: 1;
          transform: scaleY(1.2);
          box-shadow: 0 1px 3px rgba(255, 77, 141, 0.3);
        }
        
        .progress-indicator.completed {
          background: linear-gradient(90deg, #8A2BE2, #9C27B0);
          opacity: 0.8;
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
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          width: 100%;
          height: 250px; /* Фиксированная высота */
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
          display: flex;
          justify-content: center;
          align-items: center;
          will-change: transform, opacity; /* Оптимизация для анимаций */
        }
        
        .question-text-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          width: 100%;
        }
        
        .question-text {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
          font-weight: 500;
          text-align: center;
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
          transition: opacity 0.1s ease-out, transform 0.1s ease-out;
        }
        
        .fade-in {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.1s ease-in, transform 0.1s ease-in;
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
          margin-bottom: 1rem;
        }
        
        .completion-stats {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #999999);
          margin-bottom: 1.5rem;
        }
        
        .completion-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        
        .btn-return {
          background-color: var(--tg-theme-button-color, #2481cc);
          color: var(--tg-theme-button-text-color, #ffffff);
          padding: 0.75rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          display: block;
          text-align: center;
        }
        
        .btn-reset {
          background: none;
          border: none;
          color: var(--tg-theme-hint-color, #999999);
          font-size: 0.9rem;
          padding: 0.5rem;
          cursor: pointer;
          text-decoration: underline;
          margin-top: 0.5rem;
        }
        
        .confirm-reset {
          margin-top: 1rem;
        }
        
        .confirm-reset p {
          font-size: 0.95rem;
          color: var(--tg-theme-hint-color, #999999);
          margin-bottom: 1rem;
        }
        
        .confirm-buttons {
          display: flex;
          gap: 0.75rem;
        }
        
        .btn-confirm-yes {
          flex: 1;
          background-color: var(--tg-theme-destructive-text-color, #ff0000);
          color: white;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .btn-confirm-no {
          flex: 1;
          background-color: var(--tg-theme-secondary-bg-color, #e0e0e0);
          color: var(--tg-theme-text-color, #000000);
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
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
        
        /* Добавляем стили для анимации свайпа */
        .question-card.swiping {
          transform: translateX(-30px);
          opacity: 0.7;
          transition: transform 0.15s ease-out, opacity 0.15s ease-out;
        }
        
        /* Добавляем подсказку о свайпе */
        .swipe-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
          color: var(--tg-theme-hint-color, #999999);
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .swipe-hint svg {
          width: 16px;
          height: 16px;
          animation: slideLeft 1.5s infinite;
        }
        
        @keyframes slideLeft {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(5px);
          }
        }

        /* Добавляем стили для свайпа вправо */
        .question-card.swiping-right {
          transform: translateX(30px);
          opacity: 0.7;
          transition: transform 0.15s ease-out, opacity 0.15s ease-out;
        }

        /* Добавляем стили для индикатора охлаждения */
        .cooldown-indicator {
          height: 4px;
          background: linear-gradient(90deg, #FF6B6B, #FF4D8D);
          border-radius: 2px;
          margin-bottom: 16px;
          transition: width 0.05s linear, opacity 0.05s linear;
          box-shadow: 0 0 4px rgba(255, 77, 141, 0.5);
        }
      `}</style>
    </div>
  );
} 