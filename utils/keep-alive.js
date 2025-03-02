import prisma from '../lib/prisma';

/**
 * Функция для выполнения легкого запроса к базе данных,
 * чтобы предотвратить переход в "спящий режим"
 */
export async function pingDatabase() {
  try {
    // Выполняем легкий запрос к базе данных
    const result = await prisma.$queryRaw`SELECT 1 as alive`;
    console.log('Database ping successful:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Database ping failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Функция для предварительной загрузки часто используемых данных
 * Это поможет "разогреть" кэш базы данных
 */
export async function preloadCommonData() {
  try {
    // Загружаем блоки и количество вопросов в них
    const blocks = await prisma.block.findMany({
      select: {
        id: true,
        name: true,
        order: true,
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { id: 'asc' }
      ]
    });
    
    console.log(`Preloaded ${blocks.length} blocks`);
    
    return { success: true, blocksCount: blocks.length };
  } catch (error) {
    console.error('Data preload failed:', error);
    return { success: false, error: error.message };
  }
}

// Экспортируем функцию для использования в API-эндпоинте
export default async function keepDatabaseAlive() {
  const pingResult = await pingDatabase();
  
  // Если пинг успешен, предзагружаем данные
  if (pingResult.success) {
    return await preloadCommonData();
  }
  
  return pingResult;
} 