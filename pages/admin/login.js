import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Проверяем, авторизован ли пользователь
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/check');
        const data = await res.json();
        
        console.log('Проверка аутентификации при загрузке:', data);
        
        if (res.ok && data.authenticated) {
          console.log('Пользователь уже авторизован, перенаправляем на /admin');
          router.push('/admin');
        }
      } catch (error) {
        console.error('Ошибка при проверке аутентификации:', error);
      }
    }
    
    checkAuth();
  }, [router]);

  // Эффект для перенаправления после успешной аутентификации
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        console.log('Перенаправление на /admin после успешной аутентификации');
        router.push('/admin');
      }, 1000); // Задержка в 1 секунду для установки cookie
      
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Пожалуйста, введите имя пользователя и пароль');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Ошибка при входе');
        return;
      }
      
      console.log('Успешная аутентификация, ожидание установки cookie');
      setSuccess(true);
      
      // Дополнительная проверка аутентификации после входа
      setTimeout(async () => {
        try {
          const checkRes = await fetch('/api/admin/check');
          const checkData = await checkRes.json();
          console.log('Повторная проверка аутентификации:', checkData);
        } catch (error) {
          console.error('Ошибка при повторной проверке:', error);
        }
      }, 500);
    } catch (error) {
      console.error('Ошибка при входе:', error);
      setError('Произошла ошибка при входе');
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
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">Успешная аутентификация! Перенаправление...</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || success}
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
              disabled={loading || success}
              required
            />
          </div>
          
          <button type="submit" disabled={loading || success}>
            {loading ? 'Вход...' : success ? 'Успешно!' : 'Войти'}
          </button>
        </form>
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
          max-width: 400px;
        }
        
        h1 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #333;
        }
        
        .error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: 4px;
          text-align: center;
        }
        
        .success {
          background-color: #d4edda;
          color: #155724;
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: 4px;
          text-align: center;
        }
        
        .login-form {
          display: flex;
          flex-direction: column;
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
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }
        
        button:disabled {
          background-color: ${success ? '#4CAF50' : '#cccccc'};
          opacity: ${success ? '0.8' : '1'};
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 