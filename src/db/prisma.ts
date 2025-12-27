import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma error', e);
});

prisma.$on('warn' as never, (e: any) => {
  logger.warn('Prisma warning', e);
});

export default prisma;

