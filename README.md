# Job Scheduler Backend

## Overview

This project implements a simple and reliable job scheduler service that allows users to schedule HTTP API calls using cron expressions. Jobs are persisted in a PostgreSQL database and executed asynchronously using an in-memory worker queue with controlled concurrency.

The system supports at-least-once execution semantics, records execution history for observability, and reloads scheduled jobs on restart to ensure durability. It is designed as a single-node service and focuses on correctness, clarity, and ease of extension rather than distributed scalability.

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma ORM
- node-cron (with seconds support)
- Axios
- Winston (logging)


## System Design
The high-level system architecture is illustrated below. 


The system is implemented as a single backend service. It separates responsibilities into API handling, scheduling, execution, and persistence to keep the design simple and maintainable.

- **API Layer (Express)**  
  Exposes REST endpoints for creating jobs, fetching execution history, and checking system health.

- **Scheduler (node-cron)**  
  Parses cron expressions and schedules jobs in memory. The scheduler only enqueues jobs and never executes them directly.

- **Worker Queue**  
  An in-memory asynchronous queue with a fixed concurrency limit of 10. This ensures controlled parallel execution and prevents overloading the system.

- **Execution Engine**  
  Workers perform HTTP POST requests to the configured API endpoints and record execution results.

- **Persistence Layer (PostgreSQL + Prisma)**  
  Job definitions and execution history are persisted to ensure durability and allow recovery after restarts.
## Data Flow

1. A client sends a request to create a job using `POST /jobs`.
2. The API validates the request and stores the job definition in the database.
3. The scheduler loads all persisted jobs on startup and registers them using cron schedules.
4. When a job is triggered, the scheduler enqueues it into the in-memory worker queue.
5. A worker picks up the job and performs an HTTP POST request to the configured API endpoint.
6. The execution result (status code, duration, success/failure) is stored in the database.
7. Clients can retrieve recent execution history using `GET /jobs/:jobId/executions`.

## API Design
### Endpoints

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

## Health & Monitoring

The service exposes a health endpoint to monitor system status and worker activity.

### Health Check Endpoint
`GET /health`

**Response**
```json
{
  "status": "healthy",
  "timestamp": "ISO-8601 timestamp",
  "worker": {
    "queueSize": 0,
    "activeWorkers": 1
  }
}
```
Description

`status` indicates whether the service is running.

`queueSize` represents the number of pending jobs waiting for execution.

`activeWorkers` shows the number of jobs currently being executed.

This endpoint can be used for basic monitoring and readiness checks.

## Running the Application

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
## Docker Support

The application can be run using Docker for a consistent runtime environment.

### Build the Docker Image
```bash
docker build -t job-scheduler .
```
### Run the Container
```bash
docker run -p 3000:3000 --env-file .env job-scheduler
```
The service will be available at `http://localhost:3000`.

Docker support simplifies setup by packaging the application and its dependencies into a single container.

## Notes / Assumptions

- The scheduler uses an in-memory worker queue with a fixed concurrency limit of 10.
- Job definitions and execution history are persisted in PostgreSQL.
- In-flight jobs are not persisted; on restart, jobs may be re-triggered (at-least-once execution).
- The system is designed as a single-node service and does not support distributed workers.
- Cron expressions (with seconds) are used for flexible scheduling.
- The `/dummy` endpoint is intended for local testing only.
