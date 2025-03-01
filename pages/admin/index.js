import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Admin() {
  const [practices, setPractices] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('practices');
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
  
  // Состояния для редактирования
  const [editingItem, setEditingItem] = useState(null);
  const [editData, setEditData] = useState({});
  
  // Добавляем состояние для отслеживания процесса выхода
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    let isMounted = true; // Флаг для предотвращения обновления состояния после размонтирования
    
    // Немедленно прекращаем выполнение, если выполняется выход
    if (isLoggingOut) {
      console.log('Компонент в процессе выхода, запросы блокированы');
      return;
    }
    
    // ID для хранения таймеров и интервалов
    const timers = [];
    
    async function fetchData() {
      try {
        // Проверяем, что компонент все еще активен перед запросом
        if (!isMounted || isLoggingOut) {
          console.log('Компонент размонтирован или в процессе выхода, запрос отменен');
          return;
        }
        
        setLoading(true);
        
        // Проверяем авторизацию
        const authRes = await fetch('/api/admin/check', { 
          credentials: 'include',
          // Добавляем случайный параметр для предотвращения кэширования
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            // Добавляем заголовок для обхода проверки пользователя Telegram
            'X-Admin-Panel': 'true'
          }
        });
        
        // Повторная проверка после запроса
        if (!isMounted || isLoggingOut) return;
        
        if (!authRes.ok) {
          console.log('Не авторизован, перенаправление на страницу входа');
          router.replace('/admin/login');
          return; // Прекращаем выполнение функции
        }
        
        // Еще одна проверка после авторизации
        if (!isMounted || isLoggingOut) return;
        
        // Загружаем данные только если авторизованы
        const [practicesRes, blocksRes, questionsRes, usersRes, answersRes] = await Promise.all([
          fetch('/api/practices', { 
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch('/api/blocks', { 
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch('/api/questions', { 
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch('/api/users', { 
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch('/api/answers', { 
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          })
        ]);
        
        // Проверяем после всех запросов
        if (!isMounted || isLoggingOut) return;
        
        // Обрабатываем ответы
        if (practicesRes.ok) {
          const data = await practicesRes.json();
          if (isMounted && !isLoggingOut) setPractices(data);
        }
        
        if (blocksRes.ok) {
          const data = await blocksRes.json();
          if (isMounted && !isLoggingOut) setBlocks(data);
        }
        
        if (questionsRes.ok) {
          const data = await questionsRes.json();
          if (isMounted && !isLoggingOut) setQuestions(data);
        }
        
        if (usersRes.ok) {
          const data = await usersRes.json();
          if (isMounted && !isLoggingOut) setUsers(data);
        }
        
        if (answersRes.ok) {
          const data = await answersRes.json();
          if (isMounted && !isLoggingOut) setAnswers(data);
        }
      } catch (error) {
        if (isMounted && !isLoggingOut) {
          console.error('Ошибка при загрузке данных:', error);
          setError('Не удалось загрузить данные');
        }
      } finally {
        if (isMounted && !isLoggingOut) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    // Функция очистки для предотвращения утечек памяти
    return () => {
      console.log('Компонент размонтирован, очистка ресурсов');
      isMounted = false;
      
      // Очищаем все таймеры
      timers.forEach(id => {
        if (typeof id === 'number') {
          clearTimeout(id);
          clearInterval(id);
        }
      });
    };
  }, [router, isLoggingOut]);
  
  // Функция выхода из админ-панели
  const handleLogout = async () => {
    try {
      console.log('Выполняется выход из админ-панели...');
      
      // Сразу устанавливаем флаг, чтобы немедленно остановить все запросы
      setIsLoggingOut(true);
      
      // Очищаем все данные сразу
      setPractices([]);
      setBlocks([]);
      setQuestions([]);
      setUsers([]);
      setAnswers([]);
      
      // Показываем состояние загрузки
      setLoading(true);
      
      // Важно: выход из localStorage сразу
      localStorage.removeItem('adminToken');
      
      // Выполняем запрос на выход
      await fetch('/api/admin/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      console.log('Выход выполнен, перенаправление...');
      
      // Немедленное перенаправление без задержки
      window.location.replace('/admin/login');
      
      // В крайнем случае, если replace не сработает, принудительно перезагружаем страницу
      setTimeout(() => {
        window.location.href = '/admin/login';
      }, 100);
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      
      // Даже при ошибке всё равно перенаправляем
      window.location.replace('/admin/login');
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
  
  // Функции редактирования
  const startEditing = (item, type) => {
    setEditingItem({ id: item.id, type });
    setEditData({ ...item });
  };
  
  const cancelEditing = () => {
    setEditingItem(null);
    setEditData({});
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveEdit = async () => {
    if (!editingItem) return;
    
    try {
      let endpoint = '';
      let method = 'PUT';
      let data = { ...editData };
      
      switch (editingItem.type) {
        case 'practice':
          endpoint = '/api/practices';
          break;
        case 'block':
          endpoint = '/api/blocks';
          break;
        case 'question':
          endpoint = '/api/questions';
          // Преобразуем строковые ID в числа
          if (data.blockId) data.blockId = parseInt(data.blockId);
          if (data.practiceId) data.practiceId = parseInt(data.practiceId);
          break;
        default:
          throw new Error('Неизвестный тип элемента');
      }
      
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error(`Не удалось сохранить изменения`);
      
      // Обновляем список элементов
      switch (editingItem.type) {
        case 'practice':
          setPractices(practices.map(p => p.id === editingItem.id ? { ...p, ...data } : p));
          break;
        case 'block':
          setBlocks(blocks.map(b => b.id === editingItem.id ? { ...b, ...data } : b));
          break;
        case 'question':
          setQuestions(questions.map(q => q.id === editingItem.id ? { ...q, ...data } : q));
          break;
      }
      
      setEditingItem(null);
      setEditData({});
      showNotification('Изменения сохранены');
    } catch (err) {
      console.error('Ошибка при сохранении изменений:', err);
      setError('Не удалось сохранить изменения');
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
  
  // Функция отображения таблицы с данными
  const renderDataTable = () => {
    switch (activeTab) {
      case 'practices':
        return (
          <div className="data-table">
            <h2>Практики</h2>
            <div className="add-form">
              <form onSubmit={handleCreatePractice}>
                <input
                  type="text"
                  placeholder="Название практики"
                  value={newPractice.name}
                  onChange={(e) => setNewPractice({ name: e.target.value })}
                  required
                />
                <button type="submit" className="add-button">Добавить</button>
              </form>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {practices.map((practice) => (
                  <tr key={practice.id}>
                    <td>{practice.id}</td>
                    <td>
                      {editingItem && editingItem.id === practice.id && editingItem.type === 'practice' ? (
                        <input
                          type="text"
                          name="name"
                          value={editData.name || ''}
                          onChange={handleEditChange}
                        />
                      ) : (
                        practice.name
                      )}
                    </td>
                    <td className="actions">
                      {editingItem && editingItem.id === practice.id && editingItem.type === 'practice' ? (
                        <>
                          <button onClick={saveEdit} className="save">Сохранить</button>
                          <button onClick={cancelEditing} className="cancel">Отмена</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(practice, 'practice')} className="edit">Редактировать</button>
                          <button onClick={() => handleDeletePractice(practice.id)} className="delete">Удалить</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'blocks':
        return (
          <div className="data-table">
            <h2>Блоки</h2>
            <div className="add-form">
              <form onSubmit={handleCreateBlock}>
                <input
                  type="text"
                  placeholder="Название блока"
                  value={newBlock.name}
                  onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                  required
                />
                <button type="submit" className="add-button">Добавить</button>
              </form>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Порядок</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.id}>
                    <td>{block.id}</td>
                    <td>
                      {editingItem && editingItem.id === block.id && editingItem.type === 'block' ? (
                        <input
                          type="text"
                          name="name"
                          value={editData.name || ''}
                          onChange={handleEditChange}
                        />
                      ) : (
                        block.name
                      )}
                    </td>
                    <td>
                      {editingItem && editingItem.id === block.id && editingItem.type === 'block' ? (
                        <input
                          type="number"
                          name="order"
                          value={editData.order || ''}
                          onChange={handleEditChange}
                        />
                      ) : (
                        block.order
                      )}
                    </td>
                    <td className="actions">
                      {editingItem && editingItem.id === block.id && editingItem.type === 'block' ? (
                        <>
                          <button onClick={saveEdit} className="save">Сохранить</button>
                          <button onClick={cancelEditing} className="cancel">Отмена</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(block, 'block')} className="edit">Редактировать</button>
                          <button onClick={() => handleDeleteBlock(block.id)} className="delete">Удалить</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'questions':
        return (
          <div className="data-table">
            <h2>Вопросы</h2>
            <div className="add-form">
              <form onSubmit={handleCreateQuestion}>
                <textarea
                  placeholder="Текст вопроса"
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  required
                />
                <div className="form-row">
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
                  <button type="submit" className="add-button">Добавить</button>
                </div>
              </form>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Текст</th>
                  <th>Блок</th>
                  <th>Практика</th>
                  <th>Порядок</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td>{question.id}</td>
                    <td className="text-cell">
                      {editingItem && editingItem.id === question.id && editingItem.type === 'question' ? (
                        <textarea
                          name="text"
                          value={editData.text || ''}
                          onChange={handleEditChange}
                        />
                      ) : (
                        <div className="truncate">{question.text}</div>
                      )}
                    </td>
                    <td>
                      {editingItem && editingItem.id === question.id && editingItem.type === 'question' ? (
                        <select
                          name="blockId"
                          value={editData.blockId || ''}
                          onChange={handleEditChange}
                        >
                          {blocks.map((block) => (
                            <option key={block.id} value={block.id}>
                              {block.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        blocks.find(b => b.id === question.blockId)?.name || 'Неизвестно'
                      )}
                    </td>
                    <td>
                      {editingItem && editingItem.id === question.id && editingItem.type === 'question' ? (
                        <select
                          name="practiceId"
                          value={editData.practiceId || ''}
                          onChange={handleEditChange}
                        >
                          {practices.map((practice) => (
                            <option key={practice.id} value={practice.id}>
                              {practice.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        practices.find(p => p.id === question.practiceId)?.name || 'Неизвестно'
                      )}
                    </td>
                    <td>
                      {editingItem && editingItem.id === question.id && editingItem.type === 'question' ? (
                        <input
                          type="number"
                          name="order"
                          value={editData.order || ''}
                          onChange={handleEditChange}
                        />
                      ) : (
                        question.order
                      )}
                    </td>
                    <td>
                      {editingItem && editingItem.id === question.id && editingItem.type === 'question' ? (
                        <select
                          name="role"
                          value={editData.role || ''}
                          onChange={handleEditChange}
                        >
                          <option value="none">none</option>
                          <option value="taker">taker</option>
                          <option value="giver">giver</option>
                        </select>
                      ) : (
                        question.role
                      )}
                    </td>
                    <td className="actions">
                      {editingItem && editingItem.id === question.id && editingItem.type === 'question' ? (
                        <>
                          <button onClick={saveEdit} className="save">Сохранить</button>
                          <button onClick={cancelEditing} className="cancel">Отмена</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(question, 'question')} className="edit">Редактировать</button>
                          <button onClick={() => handleDeleteQuestion(question.id)} className="delete">Удалить</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'users':
        return (
          <div className="data-table">
            <h2>Пользователи</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Telegram ID</th>
                  <th>Первый визит</th>
                  <th>Последний визит</th>
                  <th>Кол-во визитов</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.tgId}</td>
                    <td>{new Date(user.firstVisit).toLocaleString()}</td>
                    <td>{new Date(user.lastVisit).toLocaleString()}</td>
                    <td>{user.visitCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        
      case 'answers':
        return (
          <div className="data-table">
            <h2>Ответы</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Вопрос ID</th>
                  <th>Пользователь ID</th>
                  <th>Telegram ID</th>
                  <th>Текст</th>
                  <th>Дата создания</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((answer) => {
                  const user = users.find(u => u.id === answer.userId);
                  return (
                    <tr key={answer.id}>
                      <td>{answer.id}</td>
                      <td>{answer.questionId}</td>
                      <td>{answer.userId}</td>
                      <td>{user ? user.tgId : 'Неизвестно'}</td>
                      <td className="text-cell">
                        <div className="truncate">{answer.text}</div>
                      </td>
                      <td>{new Date(answer.createdAt).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        
      default:
        return <div>Выберите таблицу</div>;
    }
  };
  
  return (
    <div className="admin-container">
      <Head>
        <title>Админ-панель</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <header className="admin-header">
        <h1>Админ-панель БД</h1>
        <button onClick={handleLogout} className="logout-button">Выйти</button>
      </header>
      
      {notification && (
        <div className="notification">{notification}</div>
      )}
      
      {error && (
        <div className="error">{error}</div>
      )}
      
      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="admin-layout">
          <div className="sidebar">
            <ul className="table-list">
              <li 
                className={activeTab === 'practices' ? 'active' : ''}
                onClick={() => setActiveTab('practices')}
              >
                Практики
              </li>
              <li 
                className={activeTab === 'blocks' ? 'active' : ''}
                onClick={() => setActiveTab('blocks')}
              >
                Блоки
              </li>
              <li 
                className={activeTab === 'questions' ? 'active' : ''}
                onClick={() => setActiveTab('questions')}
              >
                Вопросы
              </li>
              <li 
                className={activeTab === 'users' ? 'active' : ''}
                onClick={() => setActiveTab('users')}
              >
                Пользователи
              </li>
              <li 
                className={activeTab === 'answers' ? 'active' : ''}
                onClick={() => setActiveTab('answers')}
              >
                Ответы
              </li>
            </ul>
          </div>
          
          <div className="content">
            {renderDataTable()}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .admin-container {
          width: 100%;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          font-size: 14px;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }
        
        .admin-header h1 {
          font-size: 1.5rem;
          margin: 0;
        }
        
        .logout-button {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        .notification {
          background-color: #d4edda;
          color: #155724;
          padding: 0.5rem 1rem;
          text-align: center;
        }
        
        .error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 0.5rem 1rem;
          text-align: center;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          font-size: 1.2rem;
          color: #6c757d;
        }
        
        .admin-layout {
          display: flex;
          height: calc(100vh - 60px);
        }
        
        .sidebar {
          width: 200px;
          background-color: #f8f9fa;
          border-right: 1px solid #dee2e6;
          overflow-y: auto;
        }
        
        .table-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .table-list li {
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid #dee2e6;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .table-list li:hover {
          background-color: #e9ecef;
        }
        
        .table-list li.active {
          background-color: #007bff;
          color: white;
        }
        
        .content {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }
        
        .data-table {
          width: 100%;
        }
        
        .data-table h2 {
          font-size: 1.25rem;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .add-form {
          margin-bottom: 1rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }
        
        .add-form form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-row {
          display: flex;
          gap: 0.5rem;
        }
        
        .add-form input,
        .add-form select,
        .add-form textarea {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
        }
        
        .add-form textarea {
          min-height: 100px;
          resize: vertical;
        }
        
        .add-button {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 0.375rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          border: 1px solid #dee2e6;
        }
        
        th, td {
          padding: 0.5rem;
          border: 1px solid #dee2e6;
          text-align: left;
        }
        
        th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .text-cell {
          max-width: 300px;
        }
        
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        
        .actions {
          display: flex;
          gap: 0.25rem;
          white-space: nowrap;
        }
        
        .edit, .save {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        
        .delete {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        
        .cancel {
          background-color: #6c757d;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        
        /* Форма редактирования */
        td input,
        td select,
        td textarea {
          width: 100%;
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          border: 1px solid #ced4da;
          border-radius: 4px;
        }
        
        td textarea {
          min-height: 80px;
          resize: vertical;
        }
      `}</style>
    </div>
  );
} 