import prisma from '../db/prisma';
import logger from '../utils/logger';

export interface JobSpec {
  schedule: string;
  api: string;
  type: string;
}

export interface CreateJobResult {
  jobId: string;
}

export interface JobExecutionResult {
  id: string;
  executedAt: Date;
  statusCode: number | null;
  durationMs: number;
  success: boolean;
}

export class JobService {
  async createJob(spec: JobSpec): Promise<CreateJobResult> {
    try {
      const job = await prisma.job.create({
        data: {
          schedule: spec.schedule,
          api: spec.api,
          type: spec.type,
        },
      });

      logger.info(`Job created: ${job.id}`, { jobId: job.id, api: spec.api });
      return { jobId: job.id };
    } catch (error) {
      logger.error('Failed to create job', { error, spec });
      throw error;
    }
  }

  async getJobExecutions(jobId: string, limit: number = 5): Promise<JobExecutionResult[]> {
    try {
      const executions = await prisma.jobExecution.findMany({
        where: { jobId },
        orderBy: { executedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          executedAt: true,
          statusCode: true,
          durationMs: true,
          success: true,
        },
      });

      return executions;
    } catch (error) {
      logger.error('Failed to get job executions', { error, jobId });
      throw error;
    }
  }

  async getAllJobs(): Promise<Array<{ id: string; schedule: string; api: string; type: string }>> {
    try {
      const jobs = await prisma.job.findMany({
        select: {
          id: true,
          schedule: true,
          api: true,
          type: true,
        },
      });
      return jobs;
    } catch (error) {
      logger.error('Failed to get all jobs', { error });
      throw error;
    }
  }

  async recordExecution(
    jobId: string,
    statusCode: number | null,
    durationMs: number,
    success: boolean
  ): Promise<void> {
    try {
      await prisma.jobExecution.create({
        data: {
          jobId,
          statusCode,
          durationMs,
          success,
        },
      });

      logger.info(`Execution recorded: ${jobId}`, {
        jobId,
        statusCode,
        durationMs,
        success,
      });
    } catch (error) {
      logger.error('Failed to record execution', { error, jobId });
      throw error;
    }
  }
}

export default new JobService();

