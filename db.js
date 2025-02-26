const { Pool } = require('pg');
require('dotenv').config();

// Создаем пул соединений с базой данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Для подключения к Neon через SSL
  }
});

// Функция для создания таблицы пользователей
async function createUsersTable() {
  try {
    // Чтение SQL-скрипта из файла
    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Выполнение SQL-скрипта
    await pool.query(schema);
    console.log('Таблица пользователей успешно создана или уже существует');
  } catch (error) {
    console.error('Ошибка при создании таблицы пользователей:', error);
    throw error;
  }
}

// Функция для добавления нового пользователя
async function createUser(username, email, passwordHash) {
  const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at
  `;
  
  try {
    const result = await pool.query(query, [username, email, passwordHash]);
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при создании пользователя:', error);
    throw error;
  }
}

// Функция для получения пользователя по email
async function getUserByEmail(email) {
  const query = 'SELECT * FROM users WHERE email = $1';
  
  try {
    const result = await pool.query(query, [email]);
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при поиске пользователя по email:', error);
    throw error;
  }
}

// Функция для получения пользователя по id
async function getUserById(id) {
  const query = 'SELECT * FROM users WHERE id = $1';
  
  try {
    const result = await pool.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при поиске пользователя по id:', error);
    throw error;
  }
}

// Функция для получения всех пользователей
async function getAllUsers() {
  const query = 'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC';
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    throw error;
  }
}

module.exports = {
  pool,
  createUsersTable,
  createUser,
  getUserByEmail,
  getUserById,
  getAllUsers
}; 