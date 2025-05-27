# backend/celery_utils.py
import os
from celery import Celery
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_celery_app():
    """
    Create and configure Celery app with proper auto-discovery
    This function prevents circular imports by delaying task discovery
    """
    # Create Celery app instance
    celery_app = Celery('cross_posting_app')
    
    # Configure Celery with Windows and Python 3.13 compatibility
    celery_app.conf.update(
        # Broker and backend configuration
        broker_url=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
        result_backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
        
        # Serialization configuration
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        
        # Timezone configuration
        timezone='UTC',
        enable_utc=True,
        
        # Task tracking and timing
        task_track_started=True,
        task_time_limit=30 * 60,  # 30 minutes
        task_soft_time_limit=25 * 60,  # 25 minutes
        
        # Windows and Python 3.13 compatibility settings
        worker_pool='solo',  # Use solo pool instead of prefork for better Windows compatibility
        worker_concurrency=1,  # Single process for solo pool
        worker_prefetch_multiplier=1,
        task_acks_late=True,
        worker_hijack_root_logger=False,
        worker_log_color=True,
        
        # Simplified auto-discovery
        include=['tasks'],
        
        # Task routing
        task_routes={
            'tasks.*': {'queue': 'celery'},
        },
        
        # Additional worker settings for stability
        worker_disable_rate_limits=True,
        task_ignore_result=False,
        result_expires=3600,  # 1 hour
        
        # Python 3.13 compatibility
        worker_send_task_events=True,
        task_send_sent_event=True,
    )
    
    # Configure auto-discovery for task modules
    celery_app.autodiscover_tasks(['tasks'])
    
    return celery_app

# Create the global Celery app instance
# This ensures all parts of the application use the same instance
celery_app = create_celery_app()

# Export for use in other modules
__all__ = ['celery_app'] 