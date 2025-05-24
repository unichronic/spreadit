# backend/tasks_simple.py
from celery_utils import celery_app

@celery_app.task(bind=True)
def simple_publish_task(self, user_id, post_id, platform_name):
    """Simplified publish task to test Celery execution without complex imports"""
    try:
        # Basic task logic without database or service imports
        result = {
            "status": "success",
            "platform": platform_name,
            "user_id": user_id,
            "post_id": post_id,
            "message": "Task executed successfully"
        }
        return result
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "platform": platform_name
        } 