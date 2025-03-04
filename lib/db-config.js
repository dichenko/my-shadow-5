// Формируем URL подключения к базе данных из переменных окружения
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = 'localhost';
const dbPort = '5432';

// Формируем URL для подключения
const dbUrl = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

// Устанавливаем переменные окружения для Prisma
process.env.POSTGRES_PRISMA_URL = dbUrl;
process.env.POSTGRES_URL_NON_POOLING = dbUrl;

module.exports = {
  dbUrl
}; 