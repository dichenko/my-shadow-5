import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import UserPhoto from '../components/UserPhoto';
import BottomMenu from '../components/BottomMenu';
import { useUser } from '../utils/context';

export default function Pair() {
  const { user, loading: userLoading } = useUser();
  const [pairCode, setPairCode] = useState(null);
  const [hasPair, setHasPair] = useState(false);
  const [partnerCode, setPartnerCode] = useState('');
  const [matchingDesires, setMatchingDesires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const codeRef = useRef(null);

  // Получаем код пары
  useEffect(() => {
    if (!userLoading && user) {
      fetchPairCode();
    }
  }, [userLoading, user]);

  // Получаем совпадающие желания, если есть пара
  useEffect(() => {
    if (hasPair) {
      fetchMatchingDesires();
    }
  }, [hasPair]);

  // Функция для получения кода пары
  const fetchPairCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/pair-code');
      const data = await response.json();
      
      if (response.ok) {
        setPairCode(data.pairCode);
        setHasPair(data.hasPair);
      } else {
        setError(data.error || 'Не удалось получить код пары');
      }
    } catch (err) {
      setError('Ошибка при получении кода пары');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения совпадающих желаний
  const fetchMatchingDesires = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/matching-desires');
      const data = await response.json();
      
      if (response.ok) {
        setMatchingDesires(data.matchingDesires || []);
      } else {
        setError(data.error || 'Не удалось получить совпадающие желания');
      }
    } catch (err) {
      setError('Ошибка при получении совпадающих желаний');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для создания пары
  const createPair = async () => {
    if (!partnerCode) {
      setError('Введите код партнера');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/create-pair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pairCode: partnerCode }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Пара успешно создана!');
        setPartnerCode('');
        // Обновляем информацию о паре
        fetchPairCode();
      } else {
        setError(data.error || 'Не удалось создать пару');
      }
    } catch (err) {
      setError('Ошибка при создании пары');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Функция для удаления пары
  const deletePair = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/delete-pair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Пара успешно удалена!');
        setDeleteConfirm(false);
        // Обновляем информацию о паре
        fetchPairCode();
      } else {
        setError(data.error || 'Не удалось удалить пару');
      }
    } catch (err) {
      setError('Ошибка при удалении пары');
      console.error(err);
    } finally {
      setLoading(false);
    }
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
        .catch(err => {
          console.error('Не удалось скопировать код:', err);
        });
    }
  };

  // Функция для отображения типа ответа
  const getAnswerText = (answer) => {
    switch (answer) {
      case 'yes':
        return 'Да';
      case 'maybe':
        return 'Не уверен(а)';
      case 'no':
        return 'Нет';
      default:
        return answer;
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Моя пара | MyShadowApp</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />
        <meta name="description" content="Моя пара в MyShadowApp" />
      </Head>

      <UserPhoto />

      <main className="main">
        <div className="pair-container">
          <h1>Моя пара</h1>
          
          {loading && <div className="loading">Загрузка...</div>}
          
          {error && <div className="error">{error}</div>}
          
          {success && <div className="success">{success}</div>}
          
          {!loading && !hasPair && (
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
                    onClick={createPair}
                    disabled={loading || !partnerCode}
                  >
                    Создать пару
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!loading && hasPair && (
            <div className="has-pair">
              <div className="pair-status">
                <div className="pair-icon">👥</div>
                <p>У вас есть пара!</p>
                
                {!deleteConfirm ? (
                  <button 
                    className="delete-button" 
                    onClick={() => setDeleteConfirm(true)}
                  >
                    Удалить партнера
                  </button>
                ) : (
                  <div className="confirm-delete">
                    <p>Вы уверены?</p>
                    <div className="confirm-buttons">
                      <button 
                        className="confirm-yes" 
                        onClick={deletePair}
                        disabled={loading}
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
              
              <div className="matching-desires">
                <h2>Совпадающие желания</h2>
                
                {matchingDesires.length === 0 ? (
                  <div className="no-matches">
                    <p>У вас пока нет совпадающих желаний с партнером.</p>
                    <p>Продолжайте отвечать на вопросы, чтобы найти совпадения!</p>
                  </div>
                ) : (
                  <div className="matches-list">
                    {matchingDesires.map((block) => (
                      <div key={block.blockId} className="match-block">
                        <h3>{block.blockName}</h3>
                        <ul>
                          {block.matches.map((match, index) => (
                            <li key={index} className="match-item">
                              {match.type === 'regular' ? (
                                <div className="regular-match">
                                  <div className="match-question">{match.questionText}</div>
                                  <div className="match-answers">
                                    <span className="user-answer">Вы: {getAnswerText(match.userAnswer)}</span>
                                    <span className="partner-answer">Партнер: {getAnswerText(match.partnerAnswer)}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="role-match">
                                  <div className="match-practice">{match.practiceName}</div>
                                  <div className="match-roles">
                                    {match.userRole === 'giver' ? (
                                      <>
                                        <div className="user-role">Вы хотите дать: {getAnswerText(match.userAnswer)}</div>
                                        <div className="partner-role">Партнер хочет получить: {getAnswerText(match.partnerAnswer)}</div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="user-role">Вы хотите получить: {getAnswerText(match.userAnswer)}</div>
                                        <div className="partner-role">Партнер хочет дать: {getAnswerText(match.partnerAnswer)}</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
        
        h1 {
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
          gap: 2rem;
        }
        
        .pair-status {
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .pair-icon {
          font-size: 3rem;
        }
        
        .delete-button {
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
        }
        
        .confirm-yes, .confirm-no {
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
          background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
          padding: 1.5rem;
          border-radius: 12px;
        }
        
        .no-matches {
          text-align: center;
          padding: 1rem;
          color: var(--tg-theme-hint-color, #999999);
        }
        
        .matches-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .match-block {
          background-color: var(--tg-theme-bg-color, #ffffff);
          border-radius: 8px;
          padding: 1rem;
        }
        
        .match-block h3 {
          font-size: 1.2rem;
          margin-bottom: 0.8rem;
          color: var(--tg-theme-button-color, #2481cc);
        }
        
        .match-block ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .match-item {
          padding: 0.8rem;
          border-radius: 6px;
          background-color: rgba(36, 129, 204, 0.1);
        }
        
        .match-question, .match-practice {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        
        .match-answers, .match-roles {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.9rem;
        }
        
        .user-answer, .user-role {
          color: var(--tg-theme-button-color, #2481cc);
        }
        
        .partner-answer, .partner-role {
          color: #9c27b0;
        }
      `}</style>
    </div>
  );
} 