const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = 'localhost';
const dbPort = '5432';

// Формируем URL для подключения
const dbUrl = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

// Выводим URL для использования в shell
console.log(dbUrl); 