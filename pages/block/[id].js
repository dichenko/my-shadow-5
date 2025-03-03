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
        
        // Проверяем формат данных и извлекаем массив вопросов
        let allQuestions = [];
        if (allQuestionsData && typeof allQuestionsData === 'object') {
          // Если API вернул объект с полем questions (новый формат)
          if (Array.isArray(allQuestionsData.questions)) {
            allQuestions = allQuestionsData.questions;
            console.log('Загружены все вопросы (новый формат):', allQuestions.length);
          } 
          // Если API вернул массив напрямую (старый формат)
          else if (Array.isArray(allQuestionsData)) {
            allQuestions = allQuestionsData;
            console.log('Загружены все вопросы (старый формат):', allQuestions.length);
          }
          // Если формат неожиданный, используем пустой массив
          else {
            console.error('Неожиданный формат данных всех вопросов:', allQuestionsData);
            allQuestions = [];
          }
        } else {
          console.error('Данные всех вопросов не являются объектом:', allQuestionsData);
          allQuestions = [];
        }
        
        setTotalQuestions(allQuestions.length);
        
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
        
        // Проверяем формат данных и извлекаем массив вопросов
        let filteredQuestions = [];
        if (questionsData && typeof questionsData === 'object') {
          // Если API вернул объект с полем questions (новый формат)
          if (Array.isArray(questionsData.questions)) {
            filteredQuestions = questionsData.questions;
            console.log('Загружены вопросы для пользователя (новый формат):', filteredQuestions.length);
          } 
          // Если API вернул массив напрямую (старый формат)
          else if (Array.isArray(questionsData)) {
            filteredQuestions = questionsData;
            console.log('Загружены вопросы для пользователя (старый формат):', filteredQuestions.length);
          }
          // Если формат неожиданный, используем пустой массив
          else {
            console.error('Неожиданный формат данных вопросов:', questionsData);
            filteredQuestions = [];
          }
        } else {
          console.error('Данные вопросов не являются объектом:', questionsData);
          filteredQuestions = [];
        }
        
        setQuestions(filteredQuestions);
        
        // Если нет вопросов, на которые пользователь еще не ответил, показываем сообщение
        if (filteredQuestions.length === 0 && allQuestions.length > 0) {
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

  // Функция для отправки ответа
  const submitAnswer = async (answer) => {
    if (!user || !questions.length || submitting) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // Проверяем наличие текущего вопроса и его ID
    if (!currentQuestion || !currentQuestion.id) {
      console.error('Ошибка: вопрос не найден или некорректный ID', currentQuestionIndex, questions);
      setError('Произошла ошибка. Вопрос не найден. Обновите страницу и попробуйте снова.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Определяем, какой ID использовать: внутренний ID базы данных или Telegram ID
      const userId = user.dbId || user.id;
      
      // Создаем копию массива вопросов
      const updatedQuestions = [...questions];
      
      // Сохраняем ID обрабатываемого вопроса
      const processedQuestionId = currentQuestion.id;
      
      // Определяем следующий индекс до удаления вопроса
      let nextIndex = currentQuestionIndex;
      if (updatedQuestions.length > 1) {
        // Если это последний вопрос, переходим к первому, иначе к следующему
        nextIndex = currentQuestionIndex >= updatedQuestions.length - 1 ? 0 : currentQuestionIndex + 1;
      }
      
      // Анимация исчезновения текущего вопроса
      setFadeOut(true);
      
      // Подготавливаем данные для отправки на сервер
      const answerData = {
        questionId: parseInt(currentQuestion.id),
        userId: userId,
        text: answer // "yes", "no", "maybe"
      };
      
      console.log('Отправляем ответ:', answerData);
      
      // Удаляем вопрос из массива сразу
      const filteredQuestions = updatedQuestions.filter(q => q.id !== processedQuestionId);
      
      // Устанавливаем следующий индекс и запускаем анимацию появления нового вопроса
      setTimeout(() => {
        // Обновляем список вопросов
        setQuestions(filteredQuestions);
        
        // Если вопросов больше нет, показываем сообщение о завершении
        if (filteredQuestions.length === 0) {
          console.log('Все вопросы отвечены, показываем поздравление');
          setShowCompletionMessage(true);
          setAllQuestionsAnswered(true);
          createHearts();
          
          // Через 2.5 секунды переходим на главную страницу
          setTimeout(() => {
            router.push('/questions');
          }, 2500);
        } else {
          // Если есть следующий вопрос, устанавливаем индекс
          // Если после удаления текущий индекс стал слишком большим, корректируем его
          if (nextIndex >= filteredQuestions.length) {
            nextIndex = 0;
          }
          setCurrentQuestionIndex(nextIndex);
          
          // Запускаем анимацию появления нового вопроса
          setTimeout(() => {
            setFadeOut(false);
          }, 50);
        }
      }, 200); // Увеличиваем время анимации исчезновения для более плавного эффекта
      
      // Асинхронно отправляем ответ на сервер
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
          const responseText = await response.text();
          try {
            data = JSON.parse(responseText);
          } catch (jsonError) {
            console.error('Ошибка при парсинге JSON:', jsonError, 'Текст ответа:', responseText);
            data = { error: 'Ошибка при парсинге ответа сервера' };
          }
        } catch (parseError) {
          console.error('Ошибка при чтении ответа:', parseError);
          data = { error: 'Не удалось прочитать ответ сервера' };
        }
        
        if (!response.ok) {
          console.error('Ошибка при отправке ответа. Статус:', response.status, 'Ответ:', data);
          
          // В случае ошибки отображаем сообщение
          if (response.status === 404 && data.error === 'Вопрос не найден') {
            setError('Произошла ошибка при сохранении ответа. Вопрос не найден.');
          } else {
            setError(data.error || 'Ошибка при сохранении ответа');
          }
          
          return;
        }
        
        console.log('Ответ успешно сохранен:', data);
        
        // Инвалидируем кэш для обновления счетчика ответов
        queryClient.invalidateQueries(['blocks-with-questions']);
      })
      .catch(err => {
        console.error('Ошибка при отправке ответа:', err);
        setError('Сетевая ошибка. Пожалуйста, проверьте подключение и попробуйте снова.');
      })
      .finally(() => {
        setSubmitting(false);
      });
      
    } catch (err) {
      console.error('Ошибка при подготовке отправки ответа:', err);
      setError(err.message || 'Не удалось сохранить ответ. Пожалуйста, попробуйте еще раз.');
      
      // В случае ошибки отменяем анимацию исчезновения
      setFadeOut(false);
      setSubmitting(false);
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
        ) : allQuestionsAnswered || showCompletionMessage || questions.length === 0 ? (
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
        ) : !currentQuestion ? (
          <div className="error">Вопрос не найден. Пожалуйста, вернитесь к списку блоков.</div>
        ) : (
          <div className="question-container">
            <div 
              className={`question-card ${fadeOut ? 'fade-out' : 'fade-in'}`}
              ref={questionCardRef}
              style={{ background: 'linear-gradient(135deg, rgba(250, 245, 255, 0.8) 0%, rgba(243, 232, 255, 0.6) 100%)' }}
            >
              <div className="question-text-container">
                <p className="question-text">{currentQuestion.text}</p>
              </div>
            </div>
            
            <div className="answer-buttons-row">
              <button 
                className="btn btn-dont-want"
                onClick={() => submitAnswer('no')}
                disabled={submitting || fadeOut}
              >
                НЕ ХОЧУ
              </button>
              
              <button 
                className="btn btn-want"
                onClick={() => submitAnswer('yes')}
                disabled={submitting || fadeOut}
              >
                ХОЧУ
              </button>
            </div>
            
            <div className="answer-buttons-row-second">
              <button 
                className="btn btn-maybe"
                onClick={() => submitAnswer('maybe')}
                disabled={submitting || fadeOut}
              >
                не уверен(а)
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
          position: relative;
          padding-bottom: 15px;
        }
        
        .question-card {
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          width: 100%;
          height: 250px; /* Фиксированная высота */
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
          display: flex;
          justify-content: center;
          align-items: center;
          will-change: transform, opacity; /* Оптимизация для анимаций */
          background: linear-gradient(135deg, rgba(250, 245, 255, 0.8) 0%, rgba(243, 232, 255, 0.6) 100%);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(233, 213, 255, 0.3);
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
        
        .answer-buttons-row {
          display: flex;
          width: 100%;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        
        .answer-buttons-row-second {
          display: flex;
          justify-content: center;
          width: 100%;
          margin-bottom: 1rem;
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
          background-color: var(--purple-600);
          color: white;
          font-size: 1.2rem;
          flex: 1;
        }
        
        .btn-dont-want {
          background-color: var(--app-error, #F44336);
          color: white;
          font-size: 1.2rem;
          flex: 1;
        }
        
        .btn-maybe {
          background-color: rgba(233, 213, 255, 0.3);
          color: var(--tg-theme-hint-color, #999999);
          font-size: 0.9rem;
          font-weight: normal;
          padding: 0.6rem 1.5rem;
          border: 1px solid rgba(233, 213, 255, 0.5);
        }
        
        .fade-out {
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.2s ease-out, transform 0.2s ease-out;
        }
        
        .fade-in {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.2s ease-in, transform 0.2s ease-in;
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
        
        .cooldown-indicator {
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 100%;
          margin: 0;
          z-index: 10;
          text-align: center;
          font-size: 0.85rem;
          color: var(--tg-theme-hint-color, #999999);
        }
      `}</style>
    </div>
  );
}