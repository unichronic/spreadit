# backend/celery_utils.py
from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv() # Load .env variables

# Create Celery instance
celery_app = Celery('cross_posting_tasks')

# Configure Celery
celery_app.conf.update(
    broker_url=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    result_backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    # Include both tasks modules
    include=['tasks']
)

# Import tasks explicitly to ensure they are registered
try:
    import tasks
except ImportError:
    pass  # Tasks will be loaded when needed 