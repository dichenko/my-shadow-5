import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Admin() {
  const [practices, setPractices] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
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
      showNotification('Практика успешно создана');
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
      showNotification('Блок успешно создан');
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
      showNotification('Вопрос успешно создан');
    } catch (err) {
      console.error('Ошибка при создании вопроса:', err);
      setError('Не удалось создать вопрос');
    }
  };
  
  // Функции удаления
  const handleDeletePractice = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить эту практику?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/practices?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Не удалось удалить практику');
      }
      
      setPractices(practices.filter(practice => practice.id !== id));
      showNotification('Практика успешно удалена');
    } catch (err) {
      console.error('Ошибка при удалении практики:', err);
      setError(err.message || 'Не удалось удалить практику');
    }
  };
  
  const handleDeleteBlock = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот блок?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/blocks?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Не удалось удалить блок');
      }
      
      setBlocks(blocks.filter(block => block.id !== id));
      showNotification('Блок успешно удален');
    } catch (err) {
      console.error('Ошибка при удалении блока:', err);
      setError(err.message || 'Не удалось удалить блок');
    }
  };
  
  const handleDeleteQuestion = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/questions?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Не удалось удалить вопрос');
      }
      
      setQuestions(questions.filter(question => question.id !== id));
      showNotification('Вопрос успешно удален');
    } catch (err) {
      console.error('Ошибка при удалении вопроса:', err);
      setError(err.message || 'Не удалось удалить вопрос');
    }
  };
  
  // Функция для отображения уведомлений
  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
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
      
      {notification && (
        <div className="notification">{notification}</div>
      )}
      
      {error && (
        <div className="error">{error}</div>
      )}
      
      {loading ? (
        <p>Загрузка...</p>
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
                <li key={practice.id} className="list-item">
                  <div className="item-content">
                    {practice.name} (ID: {practice.id})
                  </div>
                  <button 
                    onClick={() => handleDeletePractice(practice.id)}
                    className="delete-button"
                  >
                    X
                  </button>
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
                onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                required
              />
              <button type="submit">Добавить</button>
            </form>
            <ul className="admin-list">
              {blocks.map((block) => (
                <li key={block.id} className="list-item">
                  <div className="item-content">
                    {block.name} (ID: {block.id})
                  </div>
                  <button 
                    onClick={() => handleDeleteBlock(block.id)}
                    className="delete-button"
                  >
                    X
                  </button>
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
                <option value="none">none</option>
                <option value="taker">taker</option>
                <option value="giver">giver</option>
              </select>
              <button type="submit">Добавить</button>
            </form>
            <ul className="admin-list">
              {questions.map((question) => (
                <li key={question.id} className="list-item">
                  <div className="item-content">
                    <strong>ID: {question.id}</strong> - {question.text.substring(0, 50)}...
                    <br />
                    <small>
                      Блок: {blocks.find(b => b.id === question.blockId)?.name || 'Неизвестно'}, 
                      Практика: {practices.find(p => p.id === question.practiceId)?.name || 'Неизвестно'},
                      Роль: {question.role}
                    </small>
                  </div>
                  <button 
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="delete-button"
                  >
                    X
                  </button>
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
        }
        
        .logout-button {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .notification {
          background-color: #4CAF50;
          color: white;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 4px;
        }
        
        .error {
          background-color: #f44336;
          color: white;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 4px;
        }
        
        .admin-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        
        .admin-section {
          background-color: #f5f5f5;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .admin-section h2 {
          margin-top: 0;
          margin-bottom: 1rem;
          border-bottom: 1px solid #ddd;
          padding-bottom: 0.5rem;
        }
        
        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
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
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .admin-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid #ddd;
        }
        
        .list-item:last-child {
          border-bottom: none;
        }
        
        .item-content {
          flex: 1;
        }
        
        .delete-button {
          background-color: #f44336;
          color: white;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          margin-left: 1rem;
        }
        
        @media (max-width: 768px) {
          .admin-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 