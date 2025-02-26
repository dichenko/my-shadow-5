-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для ускорения поиска по email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Индекс для ускорения поиска по имени пользователя
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Комментарии к таблице и полям
COMMENT ON TABLE users IS 'Таблица для хранения информации о пользователях';
COMMENT ON COLUMN users.id IS 'Уникальный идентификатор пользователя';
COMMENT ON COLUMN users.username IS 'Имя пользователя (логин)';
COMMENT ON COLUMN users.email IS 'Email пользователя';
COMMENT ON COLUMN users.password_hash IS 'Хэш пароля пользователя';
COMMENT ON COLUMN users.created_at IS 'Дата и время создания записи';
COMMENT ON COLUMN users.updated_at IS 'Дата и время последнего обновления записи'; 