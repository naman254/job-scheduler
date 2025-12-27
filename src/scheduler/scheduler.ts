import cron from 'node-cron';
import prisma from '../db/prisma';
import jobWorker from '../workers/jobWorker';
import logger from '../utils/logger';

class Scheduler {
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  async start(): Promise<void> {
    logger.info('Starting scheduler...');

    // Load all existing jobs from database
    const jobs = await prisma.job.findMany();
    for (const job of jobs) {
      this.scheduleJob(job.id, job.schedule, job.api);
    }

    logger.info(`Scheduler started with ${jobs.length} jobs`);
  }

  scheduleJob(jobId: string, schedule: string, api: string): void {
    // Remove existing cron job if it exists
    this.unscheduleJob(jobId);

    try {
      // Validate cron expression
      if (!cron.validate(schedule)) {
        logger.error(`Invalid cron schedule: ${schedule}`, { jobId, schedule });
        return;
      }

      // Create cron job that only enqueues, never executes
      const task = cron.schedule(
        schedule,
        () => {
          logger.debug(`Scheduler triggered for job: ${jobId}`, { jobId, api });
          jobWorker.enqueue({ jobId, api });
        },
        {
          scheduled: true,
          timezone: 'UTC',
        }
      );

      this.cronJobs.set(jobId, task);
      logger.info(`Job scheduled: ${jobId}`, { jobId, schedule, api });
    } catch (error) {
      logger.error(`Failed to schedule job: ${jobId}`, { error, jobId, schedule });
    }
  }

  unscheduleJob(jobId: string): void {
    const task = this.cronJobs.get(jobId);
    if (task) {
      task.stop();
      this.cronJobs.delete(jobId);
      logger.info(`Job unscheduled: ${jobId}`, { jobId });
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping scheduler...');
    for (const [jobId, task] of this.cronJobs.entries()) {
      task.stop();
      logger.debug(`Stopped cron job: ${jobId}`, { jobId });
    }
    this.cronJobs.clear();
    logger.info('Scheduler stopped');
  }
}

export default new Scheduler();

