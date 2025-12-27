## Architecture Diagram

```mermaid
flowchart LR
    Client[Client / API Consumer]
    API[Express API Server]
    Scheduler[node-cron Scheduler]
    Queue[Worker Queue\nConcurrency = 10]
    ExternalAPI[External HTTP API]
    DB[(PostgreSQL Database)]

    Client -->|HTTP| API
    API -->|Create Job| DB
    API -->|Register Job| Scheduler
    Scheduler -->|Trigger| Queue
    Queue -->|HTTP Call| ExternalAPI
    Queue -->|Persist Result| DB
