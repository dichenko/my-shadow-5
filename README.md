# Telegram WebApp с базой данных Neon на Vercel

Этот проект демонстрирует, как создать Telegram WebApp с использованием Next.js и базы данных Neon на Vercel.

## Настройка локальной разработки

1. Установите зависимости:
   ```
   npm install
   ```

2. Создайте файл `.env` на основе `.env.example` и заполните его своими данными подключения к Neon:
   ```
   cp .env.example .env
   ```

3. Отредактируйте файл `.env` и укажите URL вашей базы данных Neon:
   ```
   DATABASE_URL=postgres://username:password@hostname:5432/database
   ```

4. Сгенерируйте клиент Prisma:
   ```
   npx prisma generate
   ```

5. Создайте миграцию базы данных:
   ```
   npx prisma migrate dev --name init
   ```

6. Запустите приложение:
   ```
   npm run dev
   ```

## Деплой на Vercel

1. Создайте проект на Vercel и подключите его к вашему репозиторию.

2. Добавьте переменную окружения `DATABASE_URL` в настройках проекта на Vercel.

3. Деплой автоматически запустит миграцию базы данных благодаря скрипту `postinstall` в `package.json`.

## Структура проекта

- `prisma/schema.prisma` - Схема базы данных Prisma
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