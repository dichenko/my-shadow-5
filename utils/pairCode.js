/**
 * Генерирует случайный код длиной 16 символов, содержащий только заглавные английские буквы и цифры
 * @returns {string} Уникальный код
 */
export function generatePairCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
}

/**
 * Проверяет, существует ли код в базе данных
 * @param {object} prisma - Prisma клиент
 * @param {string} code - Код для проверки
 * @returns {Promise<boolean>} Существует ли код
 */
export async function isPairCodeExists(prisma, code) {
  const user = await prisma.telegramUser.findUnique({
    where: { pairCode: code }
  });
  
  return !!user;
}

/**
 * Генерирует уникальный код, который не существует в базе данных
 * @param {object} prisma - Prisma клиент
 * @returns {Promise<string>} Уникальный код
 */
export async function generateUniquePairCode(prisma) {
  let code = generatePairCode();
  let exists = await isPairCodeExists(prisma, code);
  
  // Если код уже существует, генерируем новый
  while (exists) {
    code = generatePairCode();
    exists = await isPairCodeExists(prisma, code);
  }
  
  return code;
} 