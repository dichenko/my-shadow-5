-- Индексы для TelegramUser
CREATE INDEX IF NOT EXISTS "TelegramUser_tgId_idx" ON "TelegramUser" ("tgId");

-- Индексы для Block
CREATE INDEX IF NOT EXISTS "Block_order_idx" ON "Block" ("order");

-- Индексы для Question
CREATE INDEX IF NOT EXISTS "Question_blockId_idx" ON "Question" ("blockId");
CREATE INDEX IF NOT EXISTS "Question_practiceId_idx" ON "Question" ("practiceId");
CREATE INDEX IF NOT EXISTS "Question_order_idx" ON "Question" ("order");
CREATE INDEX IF NOT EXISTS "Question_blockId_order_idx" ON "Question" ("blockId", "order");

-- Индексы для Answer
CREATE INDEX IF NOT EXISTS "Answer_userId_idx" ON "Answer" ("userId");
CREATE INDEX IF NOT EXISTS "Answer_questionId_idx" ON "Answer" ("questionId");
CREATE INDEX IF NOT EXISTS "Answer_userId_questionId_idx" ON "Answer" ("userId", "questionId");
CREATE INDEX IF NOT EXISTS "Answer_createdAt_idx" ON "Answer" ("createdAt"); 