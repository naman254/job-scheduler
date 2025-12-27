# Job Scheduler Backend

A simple, clean, single-service job scheduler built with Node.js, TypeScript, Express, PostgreSQL, and Prisma.

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- node-cron (with seconds support)
- Axios
- Winston (logging)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with:
```
DATABASE_URL="postgresql://user:password@localhost:5432/job_scheduler?schema=public"
PORT=3000
LOG_LEVEL=info
```

3. Set up database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Build and run:
```bash
npm run build
npm start
```

Or for development:
```bash
npm run dev
```

## API Endpoints

### POST /jobs
Create a new job.

Request body:
```json
{
  "schedule": "31 10-15 1 * * MON-FRI",
  "api": "https://localhost:4444/foo",
  "type": "ATLEAST_ONCE"
}
```

Response:
```json
{
  "jobId": "uuid"
}
```

### GET /jobs/:jobId/executions
Get the last 5 executions for a job.

Response:
```json
[
  {
    "id": "uuid",
    "executedAt": "2024-01-01T10:00:00.000Z",
    "statusCode": 200,
    "durationMs": 150,
    "success": true
  }
]
```

### GET /health
Get service health status.

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "worker": {
    "queueSize": 0,
    "activeWorkers": 0
  }
}
```

## Architecture

- **Scheduler**: Uses node-cron to parse schedules and enqueue jobs (never executes directly)
- **Worker Queue**: In-memory async queue with concurrency limit of 10
- **Execution**: At-least-once semantics with error logging and persistence
- **Persistence**: PostgreSQL via Prisma ORM

## Cron Schedule Format

The scheduler supports standard cron format with seconds:
```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └── day of week (0-7, 0 or 7 is Sunday)
│ │ │ │ └──── month (1-12)
│ │ │ └────── day of month (1-31)
│ │ └──────── hour (0-23)
│ └────────── minute (0-59)
└──────────── second (0-59)
```

Example: `31 10-15 1 * * MON-FRI` means "at 31 seconds past minute 10-15, on day 1, every month, Monday-Friday"

