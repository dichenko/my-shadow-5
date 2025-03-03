import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BottomMenu from '../components/BottomMenu';
import MatchSwiper from '../components/MatchSwiper';
import { useUser } from '../utils/context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPairCode, fetchMatchingDesires, createPair, deletePair, fetchBlocksWithQuestions } from '../utils/api';
import { setupBackButton, setupHeader } from '../utils/telegram';

export default function Pair() {
  const { user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [partnerCode, setPartnerCode] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pairMenuOpen, setPairMenuOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const codeRef = useRef(null);
  const router = useRouter();

  // Получаем код пары с использованием React Query
  const { 
    data: pairData = {}, 
    isLoading: pairLoading,
    error: pairError
  } = useQuery({
    queryKey: ['pair-code'],
    queryFn: fetchPairCode,
    enabled: !userLoading && !!user,
    staleTime: 10 * 60 * 1000, // 10 минут
  });

  const pairCode = pairData.pairCode;
  const hasPair = pairData.hasPair;

  // Получаем совпадающие желания с использованием React Query
  const { 
    data: matchingData = {}, 
    isLoading: matchingLoading,
    error: matchingError
  } = useQuery({
    queryKey: ['matching-desires'],
    queryFn: fetchMatchingDesires,
    enabled: !!hasPair,
    staleTime: 10 * 60 * 1000, // 10 минут
  });

  const matchingDesires = matchingData.matchingDesires || [];

  // Получаем блоки с вопросами для определения общего количества вопросов в каждом блоке
  const { 
    data: blocksData = [], 
    isLoading: blocksLoading
  } = useQuery({
    queryKey: ['blocks-with-questions'],
    queryFn: () => fetchBlocksWithQuestions(),
    enabled: !userLoading && !!user,
    staleTime: 10 * 60 * 1000, // 10 минут
  });

  // Создаем словарь с количеством вопросов в каждом блоке
  const blockQuestionsCount = {};
  if (blocksData && blocksData.length > 0) {
    blocksData.forEach(block => {
      blockQuestionsCount[block.id] = block.questionsCount || 0;
    });
  }

  // Мутация для создания пары
  const createPairMutation = useMutation({
    mutationFn: (code) => createPair(code),
    onSuccess: () => {
      setSuccess('Пара успешно создана!');
      setPartnerCode('');
      // Инвалидируем кэш, чтобы обновить данные
      queryClient.invalidateQueries({ queryKey: ['pair-code'] });
      queryClient.invalidateQueries({ queryKey: ['matching-desires'] });
    },
    onError: (err) => {
      setError(err.message || 'Не удалось создать пару');
    }
  });

  // Мутация для удаления пары
  const deletePairMutation = useMutation({
    mutationFn: deletePair,
    onSuccess: () => {
      setSuccess('Пара успешно удалена');
      setDeleteConfirm(false);
      setPairMenuOpen(false);
      // Инвалидируем кэш, чтобы обновить данные
      queryClient.invalidateQueries({ queryKey: ['pair-code'] });
      queryClient.invalidateQueries({ queryKey: ['matching-desires'] });
    },
    onError: (err) => {
      setError(err.message || 'Не удалось удалить пару');
    }
  });

  // Обрабатываем ошибки запросов
  useEffect(() => {
    if (pairError) {
      setError('Не удалось получить код пары');
      console.error(pairError);
    }
    if (matchingError) {
      setError('Не удалось получить совпадающие желания');
      console.error(matchingError);
    }
  }, [pairError, matchingError]);

  // Функция для создания пары
  const handleCreatePair = async () => {
    if (!partnerCode) {
      setError('Введите код партнера');
      return;
    }

    setError(null);
    setSuccess(null);
    createPairMutation.mutate(partnerCode);
  };

  // Функция для удаления пары
  const handleDeletePair = async () => {
    setError(null);
    setSuccess(null);
    deletePairMutation.mutate();
  };

  // Функция для копирования кода
  const copyCode = () => {
    if (codeRef.current) {
      const codeText = codeRef.current.innerText;
      
      // Проверяем поддержку API буфера обмена
      if (!navigator.clipboard) {
        // Запасной вариант для старых браузеров или WebView
        fallbackCopyTextToClipboard(codeText);
        return;
      }
      
      navigator.clipboard.writeText(codeText)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch((err) => {
          console.error('Ошибка копирования в буфер обмена:', err);
          // Если основной метод не сработал, используем запасной
          fallbackCopyTextToClipboard(codeText);
        });
    }
  };
  
  // Резервный метод копирования для браузеров без поддержки Clipboard API
  const fallbackCopyTextToClipboard = (text) => {
    try {
      // Создаем временный текстовый элемент
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Делаем элемент невидимым
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } else {
          setError('Не удалось скопировать код');
        }
      } catch (err) {
        console.error('Ошибка при копировании через execCommand:', err);
        setError('Не удалось скопировать код');
      }
      
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('Ошибка при создании резервного метода копирования:', err);
      setError('Не удалось скопировать код');
    }
  };

  // Функция для отображения текста ответа
  const getAnswerText = (answer) => {
    switch (answer) {
      case 'yes':
        return 'ХОЧУ';
      case 'no':
        return 'НЕ ХОЧУ';
      case 'maybe':
        return 'СОМНЕВАЮСЬ';
      default:
        return answer;
    }
  };

  // Функция для открытия блока с совпадениями
  const openBlock = (blockId) => {
    const block = matchingDesires.find(block => block.blockId === blockId);
    if (block) {
      setSelectedBlock(block);
    }
  };

  // Функция для закрытия блока с совпадениями
  const closeBlock = () => {
    setSelectedBlock(null);
  };

  // Определяем, идет ли загрузка
  const isLoading = userLoading || pairLoading || (hasPair && matchingLoading) || createPairMutation.isPending || deletePairMutation.isPending;

  // Настраиваем интерфейс Telegram WebApp
  useEffect(() => {
    // Показываем кнопку "Назад" и устанавливаем обработчик
    setupBackButton(true, () => {
      if (selectedBlock) {
        // Если открыт блок с совпадениями, закрываем его
        closeBlock();
      } else {
        // Иначе возвращаемся на главную страницу
        router.push('/questions');
      }
    });
    
    // Устанавливаем заголовок страницы
    setupHeader({ title: 'Моя пара' });
    
    // При размонтировании компонента скрываем кнопку "Назад"
    return () => {
      setupBackButton(false);
      setupHeader({ title: 'MyShadow' });
    };
  }, [router, selectedBlock]);

  // Массив градиентов для блоков в минималистичном стиле
  const gradients = [
    'linear-gradient(135deg, var(--purple-50) 0%, var(--purple-100) 100%)',
    'linear-gradient(135deg, var(--purple-100) 0%, var(--purple-200) 100%)',
    'linear-gradient(135deg, var(--purple-200) 0%, var(--purple-300) 100%)',
    'linear-gradient(135deg, var(--purple-300) 0%, var(--purple-400) 100%)',
    'linear-gradient(135deg, var(--purple-400) 0%, var(--purple-500) 100%)'
  ];

  return (
    <div className="container">
      <Head>
        <title>Моя пара | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Моя пара в MyShadowApp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap" rel="stylesheet" />
      </Head>

      <main className="main">
        <h1 className="app-title">MyShadow</h1>
        <div className="pair-container">
          <h2 className="pair-title">Моя пара</h2>
          
          {isLoading && <div className="loading">Загрузка...</div>}
          
          {error && <div className="error">{error}</div>}
          
          {success && <div className="success">{success}</div>}
          
          {!isLoading && !hasPair && (
            <div className="no-pair">
              <div className="pair-code-section">
                <h2>Ваш код пары</h2>
                <div className="code-container">
                  <div className="code" ref={codeRef}>{pairCode}</div>
                  <button 
                    className={`copy-button ${copySuccess ? 'success' : ''}`} 
                    onClick={copyCode}
                    title={copySuccess ? "Скопировано!" : "Копировать"}
                  >
                    {copySuccess ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="code-info">
                  Поделитесь этим кодом с вашим партнером, чтобы он мог создать пару с вами.
                </p>
              </div>
              
              <div className="partner-code-section">
                <h2>Ввести код партнера</h2>
                <div className="input-container">
                  <input
                    type="text"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    placeholder="Введите код партнера"
                    maxLength={16}
                  />
                  <button 
                    className="create-button" 
                    onClick={handleCreatePair}
                    disabled={isLoading || !partnerCode}
                  >
                    Создать пару
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!isLoading && hasPair && (
            <div className="has-pair">
              <div className="pair-status-accordion">
                <div 
                  className="pair-status-header" 
                  onClick={() => setPairMenuOpen(!pairMenuOpen)}
                >
                  <div className="pair-status-info">
                    <div className="pair-icon">❤️</div>
                    <span>У вас есть пара</span>
                  </div>
                  <div className={`pair-arrow ${pairMenuOpen ? 'open' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                
                {pairMenuOpen && (
                  <div className="pair-status-content">
                    {!deleteConfirm ? (
                      <button 
                        className="delete-button" 
                        onClick={() => setDeleteConfirm(true)}
                      >
                        Удалить связь
                      </button>
                    ) : (
                      <div className="confirm-delete">
                        <p>Вы уверены? Совпадающие желания исчезнут у вас и у партнера. Ваш партнер получит сообщение, что вы прервали связь.</p>
                        <div className="confirm-buttons">
                          <button 
                            className="confirm-yes" 
                            onClick={handleDeletePair}
                            disabled={isLoading}
                          >
                            Да
                          </button>
                          <button 
                            className="confirm-no" 
                            onClick={() => setDeleteConfirm(false)}
                          >
                            Нет
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="matching-desires">
                <h2>Совпадающие желания</h2>
                
                {matchingDesires.length === 0 ? (
                  <div className="no-matches">
                    <p>У вас пока нет совпадающих желаний с партнером.</p>
                    <p>Продолжайте отвечать на вопросы, чтобы найти совпадения!</p>
                  </div>
                ) : (
                  <div className="blocks-list">
                    {matchingDesires.map((block, index) => (
                      <div 
                        key={block.blockId} 
                        className="block-card" 
                        onClick={() => openBlock(block.blockId)}
                        style={{
                          background: gradients[index % gradients.length]
                        }}
                      >
                        <div className="block-content">
                          <div className="block-info">
                            <h3 className="block-name">{block.blockName}</h3>
                            <span className="block-matches-count">
                              Совпадения: {block.matches.length} из {blockQuestionsCount[block.blockId] || '?'}
                            </span>
                          </div>
                          <div className="block-arrow">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedBlock && (
            <MatchSwiper 
              matches={selectedBlock.matches} 
              onClose={closeBlock} 
            />
          )}
        </div>
      </main>

      <BottomMenu activePage="pair" />

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
          padding-top: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 5rem;
        }
        
        .app-title {
          text-align: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 2rem;
          background: linear-gradient(90deg, #ff6b6b, #6b66ff);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 1px;
        }
        
        .pair-container {
          width: 100%;
          max-width: 600px;
          padding: 1rem;
        }
        
        .pair-title {
          font-size: 1.8rem;
          text-align: center;
          margin-bottom: 1.5rem;
          color: var(--tg-theme-text-color, #000000);
          font-family: 'Montserrat', sans-serif;
          letter-spacing: 0.5px;
          font-weight: bold;
        }
        
        h2 {
          font-size: 1.4rem;
          margin-bottom: 1rem;
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
        }
        
        .loading, .error, .success {
          text-align: center;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 8px;
        }
        
        .loading {
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
        }
        
        .error {
          background-color: rgba(255, 0, 0, 0.1);
          color: #d32f2f;
        }
        
        .success {
          background-color: rgba(0, 255, 0, 0.1);
          color: #388e3c;
        }
        
        .no-pair {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .pair-code-section, .partner-code-section {
          background-color: var(--tg-theme-secondary-bg-color, var(--purple-50));
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .code-container {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1rem;
          position: relative;
          width: 100%;
          max-width: 100%;
        }
        
        .code {
          font-family: monospace;
          font-size: 1.3rem;
          font-weight: bold;
          letter-spacing: 1px;
          padding: 0.5rem 1rem;
          background-color: var(--tg-theme-bg-color, var(--app-surface));
          border-radius: 6px;
          flex: 1;
          text-align: center;
          border: 1px solid var(--purple-200);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        
        .copy-button {
          background-color: var(--tg-theme-button-color, var(--app-primary));
          color: var(--tg-theme-button-text-color, #ffffff);
          border: none;
          border-radius: 6px;
          padding: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 40px;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          position: relative;
          margin: 0;
          transform: none !important;
          box-shadow: none;
          transform-origin: center center;
          will-change: background-color;
          z-index: 1;
        }
        
        .copy-button:active,
        .copy-button:focus,
        .copy-button:hover,
        .copy-button.success {
          background-color: var(--app-success, #4caf50);
          transform: none !important;
          top: 0 !important;
          margin: 0 !important;
          outline: none;
          box-shadow: none !important;
          position: relative;
          scale: 1 !important;
        }
        
        .code-info {
          font-size: 0.9rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .input-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        input {
          padding: 0.8rem;
          font-size: 1.1rem;
          border: 1px solid var(--tg-theme-hint-color, #999999);
          border-radius: 6px;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
        }
        
        .create-button {
          background-color: var(--tg-theme-button-color, var(--app-primary));
          color: var(--tg-theme-button-text-color, #ffffff);
          border: none;
          border-radius: 6px;
          padding: 0.8rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .create-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .has-pair {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .pair-status-accordion {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .pair-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background-color: var(--tg-theme-secondary-bg-color, var(--purple-100));
          cursor: pointer;
          user-select: none;
        }
        
        .pair-status-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .pair-icon {
          font-size: 1.2rem;
        }
        
        .pair-arrow {
          transition: transform 0.3s ease;
        }
        
        .pair-arrow.open {
          transform: rotate(180deg);
        }
        
        .pair-status-content {
          padding: 1rem;
          background-color: var(--tg-theme-secondary-bg-color, var(--purple-50));
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .delete-button {
          width: 100%;
          background-color: var(--app-error, #d32f2f);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .confirm-delete {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .confirm-delete p {
          text-align: center;
          color: #e53935;
          font-size: 0.9rem;
          max-width: 90%;
          margin-bottom: 0.5rem;
        }
        
        .confirm-buttons {
          display: flex;
          gap: 1rem;
          width: 100%;
        }
        
        .confirm-yes, .confirm-no {
          flex: 1;
          border: none;
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
        }
        
        .confirm-yes {
          background-color: var(--app-error, #d32f2f);
          color: white;
        }
        
        .confirm-no {
          background-color: var(--tg-theme-button-color, var(--app-primary));
          color: var(--tg-theme-button-text-color, #ffffff);
        }
        
        .matching-desires {
          margin-top: 1rem;
        }
        
        .no-matches {
          text-align: center;
          padding: 2rem;
          color: var(--tg-theme-hint-color, #999999);
          background-color: var(--tg-theme-secondary-bg-color, var(--purple-50));
          border-radius: 12px;
        }
        
        .blocks-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        
        .block-card {
          padding: 1.25rem;
          border-radius: 12px;
          text-decoration: none;
          color: var(--tg-theme-text-color);
          transition: transform 0.2s;
          border: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
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
        
        .block-matches-count {
          font-size: 0.875rem;
          color: var(--tg-theme-hint-color);
        }
        
        .block-arrow {
          margin-left: 1rem;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
} 