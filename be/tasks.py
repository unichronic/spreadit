# backend/tasks.py
import asyncio
import httpx
from celery_utils import celery_app
from services import posting_service
from database import SessionLocal
import crud, models

# Helper to get a DB session in Celery tasks
def get_db_session():
    return SessionLocal()

@celery_app.task
def simple_test_task(name):
    """Simple test task to verify Celery is working"""
    return f"Hello {name}! Celery is working correctly."

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60) # name="publish_to_platform_task"
def publish_to_platform_task(self, user_id: int, post_id: int, platform_name: str, canonical_url_on_your_site: str, hashnode_publication_id: str = None):
    db = get_db_session()
    published_post_entry = None
    
    try:
        current_user = db.query(models.User).filter(models.User.id == user_id).first()
        db_post = db.query(models.Post).filter(models.Post.id == post_id, models.Post.author_id == user_id).first()

        if not current_user or not db_post:
            # Log error, can't proceed
            print(f"User or Post not found for task: user_id={user_id}, post_id={post_id}")
            return {"status": "error", "message": "User or Post not found"}

        credential = crud.get_platform_credential(db, user_id=current_user.id, platform_name=platform_name)
        if not credential:
            raise Exception("Platform not connected or credential not found.")

        # Update PublishedPost status to 'processing' or similar if you want
        published_post_entry = db.query(models.PublishedPost).filter_by(
            original_post_id=db_post.id,
            platform_name=platform_name
        ).first()
        if not published_post_entry: # Should have been created before task dispatch
            published_post_entry = models.PublishedPost(
                original_post_id=db_post.id, platform_name=platform_name, status="pending"
            )
            db.add(published_post_entry)
        published_post_entry.status = "processing" # Indicate task is running
        db.commit()

        # Run async posting functions using asyncio.run()
        api_response = None
        post_data = {}
        
        if platform_name == "dev.to" and credential.api_key:
            api_response = asyncio.run(posting_service.post_to_devto(
                credential.api_key,
                db_post.title,
                db_post.content_markdown,
                canonical_url=canonical_url_on_your_site
            ))
            post_data = api_response
        elif platform_name == "hashnode" and credential.api_key:
            publication_id = hashnode_publication_id or credential.publication_id
            if not publication_id: # Or get from credential if stored there
                raise ValueError("Hashnode Publication ID required for posting.")
            api_response = asyncio.run(posting_service.post_to_hashnode(
                credential.api_key,
                publication_id,
                db_post.title,
                db_post.content_markdown,
                canonical_url=canonical_url_on_your_site
            ))
            post_data = api_response.get("data", {}).get("publishPost", {}).get("post", {})
        elif platform_name == "medium" and credential.access_token:
            api_response = asyncio.run(posting_service.post_to_medium(
                credential.access_token,
                credential.platform_user_id,
                db_post.title,
                db_post.content_markdown,
                canonical_url=canonical_url_on_your_site
            ))
            post_data = api_response.get("data", {})
        else:
            raise Exception("Platform not supported or misconfigured for task.")

        # Update PublishedPost entry with success
        published_post_entry.platform_post_id = str(post_data.get("id")) if post_data.get("id") is not None else None
        published_post_entry.platform_post_url = post_data.get("url")
        published_post_entry.status = "success"
        published_post_entry.error_message = None
        db.commit()
        return {"status": "success", "platform": platform_name, "data": api_response}

    except httpx.HTTPStatusError as e:
        error_detail = e.response.text if hasattr(e, 'response') and e.response else str(e)
        if published_post_entry:
            published_post_entry.status = "failed"
            published_post_entry.error_message = f"API Error {e.response.status_code if hasattr(e, 'response') and e.response else 'N/A'}: {error_detail[:500]}"
            db.commit()
        # Retry for server errors (5xx) or rate limits (429)
        if hasattr(e, 'response') and e.response and (500 <= e.response.status_code < 600 or e.response.status_code == 429):
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
        return {"status": "error", "platform": platform_name, "message": f"API Error: {error_detail}"}
    except Exception as e:
        if published_post_entry:
            published_post_entry.status = "failed"
            published_post_entry.error_message = str(e)[:500]
            db.commit()
        # Generic retry, or decide not to retry for certain exceptions
        # raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
        return {"status": "error", "platform": platform_name, "message": str(e)}
    finally:
        db.close()

# IMPORTANT: Create synchronous versions of your posting_service functions (e.g., post_to_devto_sync)
# or use a library like `anyio` to run async code from sync Celery tasks:
# import asyncio
# from anyio import from_thread
# result = from_thread.run(posting_service.post_to_devto, ...)
# For simplicity, assume you've created _sync versions that use `requests` instead of `httpx`.