# Celery Background Tasks Setup

This project now uses Celery for handling background publishing tasks to avoid blocking the API requests.

## Prerequisites

1. **Redis Server**: Celery requires Redis as a message broker.
   - Install Redis: https://redis.io/docs/getting-started/installation/
   - Or use Docker: `docker run -d -p 6379:6379 redis:latest`

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install celery redis email-validator
   ```

2. **Start Redis Server**:
   ```bash
   # Option 1: Direct Redis installation
   redis-server
   
   # Option 2: Docker
   docker run -d -p 6379:6379 redis:latest
   ```

3. **Start Celery Worker**:
   ```bash
   # In the backend directory (be/)
   python start_worker.py
   
   # Or manually:
   celery -A celery_app worker --loglevel=info
   ```

4. **Start FastAPI Server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## API Endpoints

### Publishing Endpoints

- **POST** `/api/posts/publish` - Dispatch tasks to publish a post to selected platforms
- **POST** `/api/posts/{post_id}/publish` - Legacy endpoint (still supported)
- **GET** `/api/posts/{post_id}/publish-history` - Get publishing history for a post

### Task Monitoring Endpoints

- **GET** `/api/tasks/status/{task_id}` - Get real-time status of a specific Celery task
- **GET** `/api/tasks/status/post/{post_id}` - Get all publishing statuses for a post

## How It Works

- **Publishing Flow**: When a user clicks "Publish", the API creates database entries and dispatches Celery tasks
- **Background Processing**: Each platform publication runs as a separate Celery task
- **Status Tracking**: The PublishedPost model tracks the status: `pending` → `processing` → `success`/`failed`
- **Real-time Monitoring**: Frontend can poll task status endpoints for live updates
- **Auto-Refresh**: The frontend automatically refreshes publish status every 30 seconds

## Task Status

### Database Status (PublishedPost)
- **pending**: Task queued but not started
- **processing**: Task is currently running
- **success**: Published successfully with platform URL
- **failed**: Publishing failed with error message

### Celery Task Status
- **PENDING**: Task waiting to be processed
- **STARTED**: Task has started execution
- **SUCCESS**: Task completed successfully
- **FAILURE**: Task failed with error
- **RETRY**: Task is being retried
- **REVOKED**: Task was cancelled

## Real-time Monitoring

The frontend includes two monitoring approaches:

1. **Database Polling**: Every 30 seconds, checks PublishedPost table for updates
2. **Task Status API**: Real-time polling of Celery task status (optional)

### Task Status Response
```json
{
  "task_id": "abc123...",
  "status": "SUCCESS",
  "result": { "platform": "dev.to", "data": {...} },
  "ready": true,
  "successful": true,
  "failed": false,
  "platform_info": {
    "platform": "dev.to",
    "data": { "id": "123", "url": "https://dev.to/..." }
  }
}
```

## Frontend Features

- **Task Status Monitor**: Real-time component showing Celery task progress
- **Enhanced Publish Dialog**: Shows live task status after dispatching
- **Toast Notifications**: Immediate feedback when tasks complete
- **Auto-refresh**: Periodic updates of publishing status

## Development

To monitor Celery tasks, you can use:
```bash
celery -A celery_app flower  # Web-based monitoring (install: pip install flower)
```

## Production Notes

- Use a production Redis setup (not localhost)
- Configure proper environment variables for Redis URLs
- Set up monitoring and logging for Celery workers
- Consider using multiple workers for better performance
- Monitor task status API usage to avoid excessive polling 