import { Router, Request, Response } from 'express';
import jobService, { JobSpec } from '../services/job.service';
import scheduler from '../scheduler/scheduler';
import logger from '../utils/logger';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const spec: JobSpec = req.body;

    // Validate required fields
    if (!spec.schedule || !spec.api || !spec.type) {
      return res.status(400).json({
        error: 'Missing required fields: schedule, api, type',
      });
    }

    // Create job in database
    const result = await jobService.createJob(spec);

    // Schedule the job
    scheduler.scheduleJob(result.jobId, spec.schedule, spec.api);

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating job', { error });
    res.status(500).json({ error: 'Failed to create job' });
  }
});

router.get('/:jobId/executions', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const executions = await jobService.getJobExecutions(jobId, 5);

    res.json(executions);
  } catch (error) {
    logger.error('Error fetching job executions', { error, jobId: req.params.jobId });
    res.status(500).json({ error: 'Failed to fetch job executions' });
  }
});

export default router;

