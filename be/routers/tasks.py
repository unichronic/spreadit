# backend/routers/tasks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import schemas, crud, models, security, database
from celery_utils import celery_app
from celery.result import AsyncResult

router = APIRouter()

@router.get("/status/{task_id}")
def get_task_status(
    task_id: str, 
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Get the status of a Celery task by task_id.
    Returns both Celery task status and related PublishedPost status if available.
    """
    try:
        task_result = AsyncResult(task_id, app=celery_app)
        
        # Get basic task information
        task_info = {
            "task_id": task_id,
            "status": task_result.status,
            "result": task_result.result if task_result.ready() else None,
            "ready": task_result.ready(),
            "successful": task_result.successful() if task_result.ready() else None,
            "failed": task_result.failed() if task_result.ready() else None,
        }
        
        # Add error information if task failed
        if task_result.failed():
            task_info["error"] = str(task_result.info)
        
        # Try to find related PublishedPost entries for additional context
        # Note: This requires that the task result contains platform and post info
        published_posts = []
        if task_result.result and isinstance(task_result.result, dict):
            result_data = task_result.result
            if "platform" in result_data:
                platform_name = result_data["platform"]
                # Try to find the PublishedPost entry
                # We'd need to know the post_id to do this effectively
                # For now, we'll just include the task result data
                task_info["platform_info"] = {
                    "platform": platform_name,
                    "data": result_data.get("data", {})
                }
        
        return task_info
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid task ID or error retrieving task: {str(e)}")

@router.get("/status/post/{post_id}")
def get_post_publishing_status(
    post_id: int,
    current_user: models.User = Depends(security.get_current_active_user),
    db: Session = Depends(database.get_db)
):
    """
    Get all publishing task statuses for a specific post.
    This combines database PublishedPost entries with any active Celery tasks.
    """
    # Verify user owns the post
    db_post = crud.get_post(db, post_id=post_id, user_id=current_user.id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get all PublishedPost entries for this post
    published_posts = db.query(models.PublishedPost).filter_by(original_post_id=post_id).all()
    
    publishing_status = {
        "post_id": post_id,
        "post_title": db_post.title,
        "platforms": []
    }
    
    for pp in published_posts:
        platform_status = {
            "platform_name": pp.platform_name,
            "status": pp.status,
            "platform_post_id": pp.platform_post_id,
            "platform_post_url": pp.platform_post_url,
            "published_at": pp.published_at,
            "error_message": pp.error_message,
            "updated_at": pp.updated_at
        }
        publishing_status["platforms"].append(platform_status)
    
    return publishing_status 