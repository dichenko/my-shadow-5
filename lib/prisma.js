import { PrismaClient } from '@prisma/client'
import './db-config' // Импортируем конфигурацию базы данных

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma 