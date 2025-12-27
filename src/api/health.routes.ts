import { Router, Request, Response } from 'express';
import jobWorker from '../workers/jobWorker';
import logger from '../utils/logger';
import prisma from '../db/prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      worker: {
        queueSize: jobWorker.getQueueSize(),
        activeWorkers: jobWorker.getActiveWorkers(),
      },
    };

    res.json(status);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

export default router;

