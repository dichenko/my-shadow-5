import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false); // Флаг для отслеживания выполненной проверки
  const router = useRouter();

  // Проверяем, авторизован ли пользователь
  useEffect(() => {
    // Предотвращаем повторные проверки авторизации
    if (authChecked) {
      return;
    }

    async function checkAuth() {
      try {
        console.log('Проверка авторизации администратора...');
        setCheckingAuth(true);
        
        const queryParams = new URLSearchParams(window.location.search);
        const adminKey = queryParams.get('adminKey');
        
        // Если есть adminKey в URL, пробуем авторизоваться с его помощью
        let checkUrl = '/api/admin/check';
        if (adminKey) {
          checkUrl = `${checkUrl}?adminKey=${adminKey}`;
        }
        
        const res = await fetch(checkUrl, {
          credentials: 'include', // Важно для передачи cookie
          headers: {
            // Если в localStorage есть adminToken, используем его как Bearer
            ...(localStorage.getItem('adminToken') && {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }),
            // Добавляем заголовок для обхода проверки пользователя Telegram
            'X-Admin-Panel': 'true'
          }
        });
        
        const data = await res.json();
        console.log('Результат проверки авторизации:', data);
        
        if (res.ok && data.authenticated) {
          console.log('Администратор авторизован, перенаправление в панель...');
          // Используем replace вместо push, чтобы избежать проблем с историей навигации
          router.replace('/admin');
          
          // Добавляем резервный метод перенаправления через window.location
          setTimeout(() => {
            console.log('Применяем резервный метод перенаправления...');
            window.location.href = '/admin';
          }, 500);
        } else {
          console.log('Администратор не авторизован, отображение формы входа');
          setDebugInfo({
            authCheck: {
              status: res.status,
              data
            }
          });
        }
      } catch (error) {
        console.error('Ошибка при проверке аутентификации:', error);
        setError('Ошибка при проверке аутентификации: ' + error.message);
      } finally {
        setCheckingAuth(false);
        setAuthChecked(true); // Отмечаем, что проверка выполнена
      }
    }
    
    checkAuth();
  }, [router, authChecked]); // Добавляем authChecked в зависимости

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Пожалуйста, введите имя пользователя и пароль');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setDebugInfo(null);
      
      console.log('Попытка входа с учетными данными:', { username });
      
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Добавляем заголовок для обхода проверки пользователя Telegram
          'X-Admin-Panel': 'true'
        },
        credentials: 'include', // Важно для сохранения cookie
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      console.log('Ответ на запрос входа:', data);
      
      if (!res.ok) {
        setError(data.message || 'Ошибка при входе');
        setDebugInfo({
          loginResponse: { status: res.status, data }
        });
        return;
      }
      
      // Сохраняем токен в localStorage в качестве запасного варианта
      localStorage.setItem('adminToken', password);
      
      // Перенаправляем на админ-панель напрямую
      console.log('Вход успешен, перенаправление в админ-панель');
      window.location.href = '/admin';
    } catch (error) {
      console.error('Ошибка при входе:', error);
      setError('Произошла ошибка при входе: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Head>
        <title>Вход в админ-панель</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="login-card">
        <h1>Вход в админ-панель</h1>
        
        {checkingAuth ? (
          <div className="loading">Проверка авторизации...</div>
        ) : (
          <>
            {error && <div className="error">{error}</div>}
            
            {debugInfo && (
              <div className="debug-info">
                <h3>Отладочная информация:</h3>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                
                <div className="auth-methods">
                  <h4>Доступные методы авторизации:</h4>
                  <ul>
                    <li>
                      <strong>Cookie:</strong> Основной метод, используется при входе с логином и паролем
                    </li>
                    <li>
                      <strong>NextAuth:</strong> Поддерживается, если вы используете NextAuth в вашем приложении
                    </li>
                    <li>
                      <strong>Bearer Token:</strong> Используйте заголовок Authorization: Bearer {process.env.ADMIN_PASSWORD}
                    </li>
                    <li>
                      <strong>URL параметр:</strong> Используйте параметр ?adminKey={process.env.ADMIN_PASSWORD} (только для тестирования)
                    </li>
                  </ul>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Имя пользователя</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <button type="submit" disabled={loading}>
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>
          </>
        )}
      </div>
      
      <style jsx>{`
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f5f5f5;
        }
        
        .login-card {
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 600px;
        }
        
        h1 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #333;
        }
        
        .error, .loading {
          background-color: #f8d7da;
          color: #721c24;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: 4px;
          text-align: center;
        }
        
        .loading {
          background-color: #e2f3f5;
          color: #0c5460;
        }
        
        .debug-info {
          background-color: #f0f8ff;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          overflow-x: auto;
        }
        
        .debug-info pre {
          white-space: pre-wrap;
          word-break: break-all;
        }
        
        .auth-methods {
          margin-top: 1rem;
          border-top: 1px solid #ddd;
          padding-top: 1rem;
        }
        
        .auth-methods ul {
          padding-left: 1.5rem;
        }
        
        .auth-methods li {
          margin-bottom: 0.5rem;
        }
        
        .form-group {
          margin-bottom: 1rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        button:hover {
          background-color: #3a7bc8;
        }
        
        button:disabled {
          background-color: #97bff0;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 