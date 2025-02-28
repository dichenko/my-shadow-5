import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BottomMenu from '../components/BottomMenu';
import MatchSwiper from '../components/MatchSwiper';
import { useUser } from '../utils/context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPairCode, fetchMatchingDesires, createPair, deletePair } from '../utils/api';
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
      navigator.clipboard.writeText(codeText)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(() => {
          setError('Не удалось скопировать код');
        });
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
    'linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 100%)',
    'linear-gradient(135deg, #D4D4D4 0%, #E8E8E8 100%)',
    'linear-gradient(135deg, #CCCCCC 0%, #E0E0E0 100%)',
    'linear-gradient(135deg, #C4C4C4 0%, #D8D8D8 100%)',
    'linear-gradient(135deg, #BCBCBC 0%, #D0D0D0 100%)'
  ];

  return (
    <div className="container">
      <Head>
        <title>Моя пара | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Моя пара в MyShadowApp" />
      </Head>

      <main className="main">
        <div className="pair-container">
          <h1 className="pair-title">Моя пара</h1>
          
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
                        <p>Вы уверены?</p>
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
                              {block.matches.length} совпадений
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
          padding-top: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 5rem;
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
        }
        
        h2 {
          font-size: 1.4rem;
          margin-bottom: 1rem;
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
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          padding: 1.5rem;
          border-radius: 12px;
        }
        
        .code-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .code {
          font-family: monospace;
          font-size: 1.4rem;
          font-weight: bold;
          letter-spacing: 1px;
          padding: 0.5rem 1rem;
          background-color: var(--tg-theme-bg-color, #ffffff);
          border-radius: 6px;
          flex: 1;
          text-align: center;
        }
        
        .copy-button {
          background-color: var(--tg-theme-button-color, #2481cc);
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
          width: 40px;
          height: 40px;
        }
        
        .copy-button.success {
          background-color: #4caf50;
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
          background-color: var(--tg-theme-button-color, #2481cc);
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
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
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
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .delete-button {
          width: 100%;
          background-color: #d32f2f;
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
          background-color: #d32f2f;
          color: white;
        }
        
        .confirm-no {
          background-color: var(--tg-theme-button-color, #2481cc);
          color: var(--tg-theme-button-text-color, #ffffff);
        }
        
        .matching-desires {
          margin-top: 1rem;
        }
        
        .no-matches {
          text-align: center;
          padding: 2rem;
          color: var(--tg-theme-hint-color, #999999);
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
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