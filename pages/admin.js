import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Admin() {
  const [practices, setPractices] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Состояния для форм
  const [newPractice, setNewPractice] = useState({ name: '' });
  const [newBlock, setNewBlock] = useState({ name: '' });
  const [newQuestion, setNewQuestion] = useState({ 
    text: '', 
    blockId: '', 
    practiceId: '', 
    role: 'none' 
  });
  
  // Загрузка данных
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Загружаем практики
        const practicesRes = await fetch('/api/practices');
        const practicesData = await practicesRes.json();
        setPractices(practicesData);
        
        // Загружаем блоки
        const blocksRes = await fetch('/api/blocks');
        const blocksData = await blocksRes.json();
        setBlocks(blocksData);
        
        // Загружаем вопросы
        const questionsRes = await fetch('/api/questions');
        const questionsData = await questionsRes.json();
        setQuestions(questionsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить данные');
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Обработчики форм
  const handleCreatePractice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/practices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPractice),
      });
      
      if (!res.ok) throw new Error('Не удалось создать практику');
      
      const data = await res.json();
      setPractices([...practices, data]);
      setNewPractice({ name: '' });
    } catch (err) {
      console.error('Ошибка при создании практики:', err);
      setError('Не удалось создать практику');
    }
  };
  
  const handleCreateBlock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBlock),
      });
      
      if (!res.ok) throw new Error('Не удалось создать блок');
      
      const data = await res.json();
      setBlocks([...blocks, data]);
      setNewBlock({ name: '' });
    } catch (err) {
      console.error('Ошибка при создании блока:', err);
      setError('Не удалось создать блок');
    }
  };
  
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      // Преобразуем строковые ID в числа
      const questionData = {
        ...newQuestion,
        blockId: parseInt(newQuestion.blockId),
        practiceId: parseInt(newQuestion.practiceId),
      };
      
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });
      
      if (!res.ok) throw new Error('Не удалось создать вопрос');
      
      const data = await res.json();
      setQuestions([...questions, data]);
      setNewQuestion({ 
        text: '', 
        blockId: '', 
        practiceId: '', 
        role: 'none' 
      });
    } catch (err) {
      console.error('Ошибка при создании вопроса:', err);
      setError('Не удалось создать вопрос');
    }
  };
  
  return (
    <div className="container">
      <Head>
        <title>Админ-панель</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <h1 className="title">Админ-панель</h1>
      
      {error && <p className="error">{error}</p>}
      
      {loading ? (
        <p className="loading">Загрузка данных...</p>
      ) : (
        <div className="admin-grid">
          {/* Секция практик */}
          <div className="section">
            <h2>Практики</h2>
            <form onSubmit={handleCreatePractice} className="form">
              <div className="form-group">
                <label htmlFor="practice-name">Название практики:</label>
                <input
                  id="practice-name"
                  type="text"
                  value={newPractice.name}
                  onChange={(e) => setNewPractice({ name: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="button">Создать практику</button>
            </form>
            
            <div className="list">
              <h3>Существующие практики:</h3>
              {practices.length === 0 ? (
                <p>Нет практик</p>
              ) : (
                <ul>
                  {practices.map((practice) => (
                    <li key={practice.id}>
                      <strong>ID: {practice.id}</strong> - {practice.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Секция блоков */}
          <div className="section">
            <h2>Блоки</h2>
            <form onSubmit={handleCreateBlock} className="form">
              <div className="form-group">
                <label htmlFor="block-name">Название блока:</label>
                <input
                  id="block-name"
                  type="text"
                  value={newBlock.name}
                  onChange={(e) => setNewBlock({ name: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="button">Создать блок</button>
            </form>
            
            <div className="list">
              <h3>Существующие блоки:</h3>
              {blocks.length === 0 ? (
                <p>Нет блоков</p>
              ) : (
                <ul>
                  {blocks.map((block) => (
                    <li key={block.id}>
                      <strong>ID: {block.id}</strong> - {block.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Секция вопросов */}
          <div className="section">
            <h2>Вопросы</h2>
            <form onSubmit={handleCreateQuestion} className="form">
              <div className="form-group">
                <label htmlFor="question-text">Текст вопроса:</label>
                <textarea
                  id="question-text"
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="question-block">Блок:</label>
                <select
                  id="question-block"
                  value={newQuestion.blockId}
                  onChange={(e) => setNewQuestion({ ...newQuestion, blockId: e.target.value })}
                  required
                >
                  <option value="">Выберите блок</option>
                  {blocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="question-practice">Практика:</label>
                <select
                  id="question-practice"
                  value={newQuestion.practiceId}
                  onChange={(e) => setNewQuestion({ ...newQuestion, practiceId: e.target.value })}
                  required
                >
                  <option value="">Выберите практику</option>
                  {practices.map((practice) => (
                    <option key={practice.id} value={practice.id}>
                      {practice.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="question-role">Роль:</label>
                <select
                  id="question-role"
                  value={newQuestion.role}
                  onChange={(e) => setNewQuestion({ ...newQuestion, role: e.target.value })}
                  required
                >
                  <option value="none">Нет роли</option>
                  <option value="1">Роль 1</option>
                  <option value="2">Роль 2</option>
                </select>
              </div>
              
              <button type="submit" className="button">Создать вопрос</button>
            </form>
            
            <div className="list">
              <h3>Существующие вопросы:</h3>
              {questions.length === 0 ? (
                <p>Нет вопросов</p>
              ) : (
                <ul>
                  {questions.map((question) => (
                    <li key={question.id}>
                      <strong>ID: {question.id}</strong> - {question.text}<br />
                      <small>
                        Блок: {blocks.find(b => b.id === question.blockId)?.name || question.blockId}, 
                        Практика: {practices.find(p => p.id === question.practiceId)?.name || question.practiceId}, 
                        Роль: {question.role}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
        }
        
        .title {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .error {
          color: var(--tg-theme-destructive-text-color, #ff0000);
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .loading {
          text-align: center;
          font-size: 1.2rem;
          margin: 2rem 0;
        }
        
        .admin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .section {
          background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .section h2 {
          margin-top: 0;
          border-bottom: 1px solid var(--tg-theme-hint-color, #999999);
          padding-bottom: 0.5rem;
        }
        
        .form {
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--tg-theme-hint-color, #999999);
          border-radius: 4px;
          background-color: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #000000);
        }
        
        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }
        
        .button {
          background-color: var(--tg-theme-button-color, #2481cc);
          color: var(--tg-theme-button-text-color, #ffffff);
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.3s;
        }
        
        .button:hover {
          background-color: var(--tg-theme-button-color, #1a6baa);
        }
        
        .list {
          margin-top: 1.5rem;
        }
        
        .list h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        
        .list ul {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .list li {
          padding: 0.5rem;
          border-bottom: 1px solid var(--tg-theme-hint-color, #dddddd);
        }
        
        .list li:last-child {
          border-bottom: none;
        }
        
        .list li small {
          display: block;
          color: var(--tg-theme-hint-color, #666666);
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
} 