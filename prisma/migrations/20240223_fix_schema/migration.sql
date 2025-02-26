-- Удаляем старые внешние ключи
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_blockId_fkey";
ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_practiceId_fkey";
ALTER TABLE "Answer" DROP CONSTRAINT IF EXISTS "Answer_questionId_fkey";
ALTER TABLE "Answer" DROP CONSTRAINT IF EXISTS "Answer_userId_fkey";

-- Обновляем таблицу TelegramUser
ALTER TABLE "TelegramUser" DROP COLUMN IF EXISTS "tgId";
ALTER TABLE "TelegramUser" ALTER COLUMN "id" DROP DEFAULT;

-- Добавляем поле order в таблицу Block
ALTER TABLE "Block" ADD COLUMN IF NOT EXISTS "order" INTEGER;
ALTER TABLE "Block" ADD COLUMN IF NOT EXISTS "practiceId" INTEGER;

-- Добавляем поле order в таблицу Question
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Создаем внешние ключи заново
ALTER TABLE "Block" ADD CONSTRAINT "Block_practiceId_fkey" 
    FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Question" ADD CONSTRAINT "Question_blockId_fkey" 
    FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Question" ADD CONSTRAINT "Question_practiceId_fkey" 
    FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" 
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Answer" ADD CONSTRAINT "Answer_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "TelegramUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE; 