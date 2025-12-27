import axios, { AxiosError } from 'axios';
import jobService from '../services/job.service';
import logger from '../utils/logger';

interface QueuedJob {
  jobId: string;
  api: string;
}

class JobWorker {
  private queue: QueuedJob[] = [];
  private processing = false;
  private activeWorkers = 0;
  private readonly concurrencyLimit = 10;
  private readonly requestTimeout = 30000; // 30 seconds

  enqueue(job: QueuedJob): void {
    this.queue.push(job);
    logger.debug(`Job enqueued: ${job.jobId}`, { jobId: job.jobId, queueSize: this.queue.length });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    // Prevent multiple concurrent processQueue calls
    if (this.processing) {
      return;
    }

    this.processing = true;

    // Process jobs up to concurrency limit
    while (this.queue.length > 0 && this.activeWorkers < this.concurrencyLimit) {
      const job = this.queue.shift();
      if (!job) break;

      this.activeWorkers++;
      // Execute job asynchronously without blocking
      this.executeJob(job).finally(() => {
        this.activeWorkers--;
        // Continue processing queue after job completes
        this.processQueue();
      });
    }

    this.processing = false;
  }

  private async executeJob(job: QueuedJob): Promise<void> {
    const startTime = Date.now();
    logger.info(`Executing job: ${job.jobId}`, { jobId: job.jobId, api: job.api });

    try {
      const response = await axios.post(job.api, {}, {
        timeout: this.requestTimeout,
        validateStatus: () => true, // Accept all status codes
      });

      const durationMs = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;

      await jobService.recordExecution(
        job.jobId,
        response.status,
        durationMs,
        success
      );

      if (success) {
        logger.info(`Job execution succeeded: ${job.jobId}`, {
          jobId: job.jobId,
          statusCode: response.status,
          durationMs,
        });
      } else {
        logger.warn(`Job execution failed: ${job.jobId}`, {
          jobId: job.jobId,
          statusCode: response.status,
          durationMs,
        });
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const axiosError = error as AxiosError;

      let statusCode: number | null = null;
      if (axiosError.response) {
        statusCode = axiosError.response.status;
      } else if (axiosError.code === 'ECONNABORTED') {
        statusCode = 408; // Request timeout
      }

      await jobService.recordExecution(
        job.jobId,
        statusCode,
        durationMs,
        false
      );

      logger.error(`Job execution error: ${job.jobId}`, {
        jobId: job.jobId,
        error: axiosError.message,
        statusCode,
        durationMs,
      });
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getActiveWorkers(): number {
    return this.activeWorkers;
  }
}

export default new JobWorker();

