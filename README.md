# Telegram WebApp с базой данных Neon на Vercel

Этот проект демонстрирует, как создать Telegram WebApp с использованием Next.js и базы данных Neon на Vercel.

## Настройка локальной разработки

1. Установите зависимости:
   ```
   npm install
   ```

2. Для локальной разработки создайте файл `.env` и укажите URL вашей базы данных Neon:
   ```
   POSTGRES_PRISMA_URL=postgres://username:password@hostname:5432/database
   POSTGRES_URL_NON_POOLING=postgres://username:password@hostname:5432/database
   ```

3. Сгенерируйте клиент Prisma:
   ```
   npx prisma generate
   ```

4. Создайте миграцию базы данных (только для локальной разработки):
   ```
   npx prisma migrate dev --name init
   ```

5. Запустите приложение:
   ```
   npm run dev
   ```

## Деплой на Vercel

1. Создайте проект на Vercel и подключите его к вашему репозиторию.

2. Подключите базу данных Neon через интеграцию Vercel. Vercel автоматически создаст необходимые переменные окружения:
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

3. При первом деплое Prisma автоматически применит миграции и создаст таблицы в базе данных.

4. При последующих деплоях Prisma будет применять только новые миграции, сохраняя существующие данные.

## Структура проекта

- `prisma/schema.prisma` - Схема базы данных Prisma
- `prisma/migrations` - Миграции базы данных
- `lib/prisma.js` - Клиент Prisma для работы с базой данных
- `pages/api/user.js` - API-эндпоинт для сохранения данных пользователя
- `pages/index.js` - Главная страница приложения
- `utils/telegram.js` - Утилиты для работы с Telegram WebApp API
- `vercel.json` - Конфигурация для деплоя на Vercel

## Как это работает

1. Пользователь открывает WebApp в Telegram.
2. Telegram передает данные пользователя в WebApp.
3. WebApp сохраняет данные пользователя в базе данных Neon через API-эндпоинт.
4. При повторном посещении WebApp обновляет информацию о последнем визите пользователя и увеличивает счетчик посещений. 