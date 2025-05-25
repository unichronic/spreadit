
import os
from celery import Celery
from dotenv import load_dotenv


load_dotenv()

def create_celery_app():
    """
    Create and configure Celery app with proper auto-discovery
    This function prevents circular imports by delaying task discovery
    """
    
    celery_app = Celery('cross_posting_app')
    
    
    celery_app.conf.update(
        
        broker_url=os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
        result_backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
        
        
        task_serializer='json',
        accept_content=['json'],
        result_serializer='json',
        
        
        timezone='UTC',
        enable_utc=True,
        
        
        task_track_started=True,
        task_time_limit=30 * 60,  
        task_soft_time_limit=25 * 60,  
        
        
        worker_pool='solo',  
        worker_concurrency=1,  
        worker_prefetch_multiplier=1,
        task_acks_late=True,
        worker_hijack_root_logger=False,
        worker_log_color=True,
        
        
        include=['tasks'],
        
        
        task_routes={
            'tasks.*': {'queue': 'celery'},
        },
        
        
        worker_disable_rate_limits=True,
        task_ignore_result=False,
        result_expires=3600,  
        
        
        worker_send_task_events=True,
        task_send_sent_event=True,
    )
    
    
    celery_app.autodiscover_tasks(['tasks'])
    
    return celery_app



celery_app = create_celery_app()


__all__ = ['celery_app'] 