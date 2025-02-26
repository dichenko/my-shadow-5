const db = require('./db');
const bcrypt = require('bcrypt');

// Функция для инициализации базы данных и добавления тестового пользователя
async function initializeDatabase() {
  try {
    // Создаем таблицу пользователей
    await db.createUsersTable();
    
    // Хэшируем пароль для тестового пользователя
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('password123', saltRounds);
    
    // Добавляем тестового пользователя
    const newUser = await db.createUser('testuser', 'test@example.com', passwordHash);
    console.log('Создан тестовый пользователь:', newUser);
    
    // Получаем пользователя по email
    const userByEmail = await db.getUserByEmail('test@example.com');
    console.log('Пользователь найден по email:', userByEmail);
    
    // Получаем список всех пользователей
    const allUsers = await db.getAllUsers();
    console.log('Все пользователи:', allUsers);
    
    // Закрываем соединение с базой данных
    await db.pool.end();
    
    console.log('Пример успешно выполнен!');
  } catch (error) {
    console.error('Ошибка при выполнении примера:', error);
    // Закрываем соединение с базой данных в случае ошибки
    await db.pool.end();
  }
}

// Запускаем пример
initializeDatabase(); 