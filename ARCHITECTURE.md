## Architecture Diagram

```mermaid
┌─────────────────────────────────────────────────────────────────┐
│                        Client/API Consumer                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
                    ┌────────▼────────┐
                    │   Express API   │
                    │   (Port 3000)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐        ┌────▼────┐
   │  POST   │         │    GET    │        │   GET   │
   │  /jobs  │         │/jobs/:id/ │        │ /health │
   │         │         │executions │        │         │
   └────┬────┘         └─────┬─────┘        └────┬────┘
        │                    │                   │
        │                    │                   │
┌───────▼────────────────────▼───────────────────▼────────┐
│              Job Service (Business Logic)                │
│  • createJob()                                          │
│  • getJobExecutions()                                   │
│  • recordExecution()                                    │
└───────┬────────────────────┬───────────────────┬────────┘
        │                    │                   │
        │                    │                   │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼────────┐
│   Scheduler    │  │  Job Worker      │  │   Database    │
│                │  │                  │  │               │
│  • node-cron   │  │  • In-memory     │  │  PostgreSQL   │
│  • Schedule    │  │    Queue         │  │               │
│    jobs        │  │  • Concurrency   │  │  • jobs       │
│  • Enqueue     │  │    Limit: 10     │  │  • executions │
│    only        │  │  • Axios HTTP    │  │               │
│                │  │  • Timeout: 30s  │  │               │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                     │                   │
        │                     │                   │
        │    Enqueue Job      │                   │
        └─────────────────────┘                   │
                    │                             │
                    │ Execute & Record            │
                    └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Data Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATE JOB:                                                 │
│     Client → API → JobService → DB → Scheduler                  │
│                                                                  │
│  2. SCHEDULED EXECUTION:                                         │
│     Cron Timer → Scheduler → Worker Queue → HTTP Request        │
│                                                                  │
│  3. RECORD RESULT:                                               │
│     Worker → JobService → DB                                    │
│                                                                  │
│  4. QUERY EXECUTIONS:                                            │
│     Client → API → JobService → DB → Response                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
