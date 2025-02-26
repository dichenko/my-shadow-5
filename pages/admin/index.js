import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Admin() {
  const [practices, setPractices] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  // Состояния для форм
  const [newPractice, setNewPractice] = useState({ name: '' });
  const [newBlock, setNewBlock] = useState({ name: '' });
  const [newQuestion, setNewQuestion] = useState({ 
    text: '', 
    blockId: '', 
    practiceId: '', 
    role: 'none' 
  });
  
  // Проверка аутентификации и загрузка данных
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Загружаем данные
        const [practicesRes, blocksRes, questionsRes] = await Promise.all([
          fetch('/api/practices'),
          fetch('/api/blocks'),
          fetch('/api/questions')
        ]);
        
        // Проверяем ответы
        if (!practicesRes.ok || !blocksRes.ok || !questionsRes.ok) {
          // Если получили 401, перенаправляем на страницу входа
          if (practicesRes.status === 401 || blocksRes.status === 401 || questionsRes.status === 401) {
            router.push('/admin/login');
            return;
          }
          
          throw new Error('Failed to fetch data');
        }
        
        // Парсим данные
        const practicesData = await practicesRes.json();
        const blocksData = await blocksRes.json();
        const questionsData = await questionsRes.json();
        
        // Обновляем состояние
        setPractices(practicesData);
        setBlocks(blocksData);
        setQuestions(questionsData);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);
  
  // Функция выхода из админ-панели
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };
  
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
    <div className="admin-container">
      <Head>
        <title>Админ-панель</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <header className="admin-header">
        <h1>Админ-панель</h1>
        <button onClick={handleLogout} className="logout-button">Выйти</button>
      </header>
      
      {loading ? (
        <p>Загрузка...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="admin-content">
          <div className="admin-section">
            <h2>Практики</h2>
            <form onSubmit={handleCreatePractice} className="admin-form">
              <input
                type="text"
                placeholder="Название практики"
                value={newPractice.name}
                onChange={(e) => setNewPractice({ name: e.target.value })}
                required
              />
              <button type="submit">Добавить</button>
            </form>
            <ul className="admin-list">
              {practices.map((practice) => (
                <li key={practice.id}>
                  {practice.name} (ID: {practice.id})
                </li>
              ))}
            </ul>
          </div>
          
          <div className="admin-section">
            <h2>Блоки</h2>
            <form onSubmit={handleCreateBlock} className="admin-form">
              <input
                type="text"
                placeholder="Название блока"
                value={newBlock.name}
                onChange={(e) => setNewBlock({ name: e.target.value })}
                required
              />
              <button type="submit">Добавить</button>
            </form>
            <ul className="admin-list">
              {blocks.map((block) => (
                <li key={block.id}>
                  {block.name} (ID: {block.id})
                </li>
              ))}
            </ul>
          </div>
          
          <div className="admin-section">
            <h2>Вопросы</h2>
            <form onSubmit={handleCreateQuestion} className="admin-form">
              <textarea
                placeholder="Текст вопроса"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                required
              />
              <select
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
              <select
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
              <select
                value={newQuestion.role}
                onChange={(e) => setNewQuestion({ ...newQuestion, role: e.target.value })}
              >
                <option value="none">Без роли</option>
                <option value="intro">Вступление</option>
                <option value="conclusion">Заключение</option>
              </select>
              <button type="submit">Добавить</button>
            </form>
            <ul className="admin-list">
              {questions.map((question) => (
                <li key={question.id}>
                  <strong>ID: {question.id}</strong> - {question.text.substring(0, 50)}...
                  <br />
                  <small>
                    Блок: {blocks.find(b => b.id === question.blockId)?.name || 'Неизвестно'}, 
                    Практика: {practices.find(p => p.id === question.practiceId)?.name || 'Неизвестно'},
                    Роль: {question.role}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .admin-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .logout-button {
          padding: 0.5rem 1rem;
          background-color: #e53e3e;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .logout-button:hover {
          background-color: #c53030;
        }
        
        .admin-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .admin-section {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .admin-form input,
        .admin-form select,
        .admin-form textarea {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .admin-form textarea {
          min-height: 100px;
          resize: vertical;
        }
        
        .admin-form button {
          padding: 0.75rem;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
        }
        
        .admin-form button:hover {
          background-color: #0060df;
        }
        
        .admin-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .admin-list li {
          padding: 0.75rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .admin-list li:last-child {
          border-bottom: none;
        }
        
        .error {
          color: #e53e3e;
          padding: 1rem;
          background-color: #fff5f5;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
} 