# backend/routers/posts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import httpx
import schemas, crud, models, security, database  # Fixed imports
from services.posting_service import post_to_devto, post_to_hashnode, post_to_medium
from tasks import publish_to_platform_task
import asyncio

router = APIRouter()

@router.post("/", response_model=schemas.Post)
def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    return crud.create_user_post(db=db, post=post, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Post])
def read_posts(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    posts = crud.get_posts_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return posts

@router.get("/{post_id}", response_model=schemas.Post)
def read_post(
    post_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    db_post = crud.get_post(db, post_id=post_id, user_id=current_user.id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return db_post

@router.put("/{post_id}", response_model=schemas.Post)
def update_post(
    post_id: int,
    post: schemas.PostCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    db_post = crud.update_post(db, post_id=post_id, user_id=current_user.id, post_update=post)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return db_post

@router.get("/{post_id}/publish-history")
def get_publish_history(
    post_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    # Verify user owns the post
    db_post = crud.get_post(db, post_id=post_id, user_id=current_user.id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get publishing history
    published_posts = db.query(models.PublishedPost).filter_by(original_post_id=post_id).all()
    
    return {
        "post_id": post_id,
        "post_title": db_post.title,
        "publish_history": [
            {
                "platform_name": pp.platform_name,
                "status": pp.status,
                "platform_post_id": pp.platform_post_id,
                "platform_post_url": pp.platform_post_url,
                "published_at": pp.published_at,
                "error_message": pp.error_message
            }
            for pp in published_posts
        ]
    }

@router.post("/publish", summary="Dispatch tasks to publish a post to selected platforms")
def publish_post_to_platforms_celery(
    request_data: schemas.PostToPlatformsRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    db_post = crud.get_post(db, post_id=request_data.post_id, user_id=current_user.id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Define canonical URL (could be on your platform)
    canonical_url_on_your_site = f"http://localhost:3000/blog/{db_post.id}"

    task_ids = {}
    for platform_name in request_data.platforms:
        # Ensure PublishedPost entry exists or create it with 'pending' status
        published_post_entry = db.query(models.PublishedPost).filter_by(
            original_post_id=db_post.id,
            platform_name=platform_name
        ).first()
        if not published_post_entry:
            published_post_entry = models.PublishedPost(
                original_post_id=db_post.id,
                platform_name=platform_name,
                status="pending"
            )
            db.add(published_post_entry)
            db.commit()
        else:  # If retrying or re-publishing
            published_post_entry.status = "pending"
            published_post_entry.error_message = None
            db.commit()

        # Special handling for Hashnode publication ID
        hashnode_pub_id = None
        if platform_name == "hashnode":
            # Fetch from PlatformCredential
            hn_cred = crud.get_platform_credential(db, user_id=current_user.id, platform_name="hashnode")
            if hn_cred:
                # Try to get from publication_id column first
                if hasattr(hn_cred, 'publication_id') and hn_cred.publication_id:
                    hashnode_pub_id = hn_cred.publication_id
                # Fallback to extra_data if available
                elif hasattr(hn_cred, 'extra_data') and hn_cred.extra_data and "publication_id" in hn_cred.extra_data:
                    hashnode_pub_id = hn_cred.extra_data["publication_id"]
                # Fallback to request data
                if not hashnode_pub_id and request_data.hashnode_publication_id:
                    hashnode_pub_id = request_data.hashnode_publication_id

        task = publish_to_platform_task.delay(
            current_user.id,
            db_post.id,
            platform_name,
            canonical_url_on_your_site,
            hashnode_publication_id=hashnode_pub_id
        )
        task_ids[platform_name] = task.id

    return {"message": "Publishing tasks dispatched.", "task_ids": task_ids}

@router.post("/{post_id}/publish")
def publish_post(
    post_id: int,
    publish_request: schemas.PublishRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    # Get the post
    db_post = crud.get_post(db, post_id=post_id, user_id=current_user.id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get user's connections to filter available platforms
    user_connections = crud.get_user_connections(db, user_id=current_user.id)
    connected_platforms = {conn.platform_name: conn for conn in user_connections}
    
    # Filter requested platforms to only include connected ones
    valid_platforms = [platform for platform in publish_request.platforms if platform in connected_platforms]
    
    if not valid_platforms:
        raise HTTPException(status_code=400, detail="No valid connected platforms selected")
    
    # Dispatch Celery tasks for each platform
    task_ids = {}
    canonical_url_on_your_site = f"http://localhost:3000/blog/{post_id}"
    
    for platform in valid_platforms:
        credential = connected_platforms[platform]
        
        # Create PublishedPost entry for tracking
        published_post_entry = db.query(models.PublishedPost).filter_by(
            original_post_id=post_id,
            platform_name=platform
        ).first()
        
        if not published_post_entry:
            published_post_entry = models.PublishedPost(
                original_post_id=post_id,
                platform_name=platform,
                status="pending"
            )
            db.add(published_post_entry)
        else:
            published_post_entry.status = "pending"
            published_post_entry.error_message = None
        
        db.commit()
        
        # Dispatch Celery task
        try:
            hashnode_publication_id = credential.publication_id if platform == "hashnode" else None
            task = publish_to_platform_task.delay(
                user_id=current_user.id,
                post_id=post_id,
                platform_name=platform,
                canonical_url_on_your_site=publish_request.canonical_url or canonical_url_on_your_site,
                hashnode_publication_id=hashnode_publication_id
            )
            task_ids[platform] = task.id
        except Exception as e:
            # If task dispatch fails, update the PublishedPost entry
            published_post_entry.status = "failed"
            published_post_entry.error_message = f"Task dispatch failed: {str(e)[:500]}"
            db.commit()
    
    return {
        "success": True,
        "post_id": post_id,
        "message": "Publishing tasks dispatched successfully",
        "task_ids": task_ids,
        "platforms_queued": list(task_ids.keys()),
        "note": "Publishing is happening in the background. Check publish history for results."
    }

@router.post("/publish-direct", summary="Publish directly without background tasks (for development)")
def publish_post_direct(
    request_data: schemas.PostToPlatformsRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    """
    Direct publishing without Celery tasks - useful for development/testing
    when Redis/Celery is not available
    """
    db_post = crud.get_post(db, post_id=request_data.post_id, user_id=current_user.id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Get user's connections
    user_connections = crud.get_user_connections(db, user_id=current_user.id)
    connected_platforms = {conn.platform_name: conn for conn in user_connections}
    
    # Filter requested platforms to only include connected ones
    valid_platforms = [platform for platform in request_data.platforms if platform in connected_platforms]
    
    if not valid_platforms:
        raise HTTPException(status_code=400, detail="No valid connected platforms selected")
    
    canonical_url_on_your_site = f"http://localhost:3000/blog/{db_post.id}"
    results = {}
    
    for platform_name in valid_platforms:
        try:
            credential = connected_platforms[platform_name]
            
            # Create or update PublishedPost entry
            published_post_entry = db.query(models.PublishedPost).filter_by(
                original_post_id=db_post.id,
                platform_name=platform_name
            ).first()
            
            if not published_post_entry:
                published_post_entry = models.PublishedPost(
                    original_post_id=db_post.id,
                    platform_name=platform_name,
                    status="processing"
                )
                db.add(published_post_entry)
            else:
                published_post_entry.status = "processing"
                published_post_entry.error_message = None
            
            db.commit()
            
            # Direct API calls (synchronous)
            if platform_name == "dev.to" and credential.api_key:
                api_response = asyncio.run(post_to_devto(
                    credential.api_key,
                    db_post.title,
                    db_post.content_markdown,
                    canonical_url=canonical_url_on_your_site
                ))
                
                # Update success
                published_post_entry.platform_post_id = str(api_response.get("id"))
                published_post_entry.platform_post_url = api_response.get("url")
                published_post_entry.status = "success"
                results[platform_name] = {"success": True, "data": api_response}
                
            elif platform_name == "hashnode" and credential.api_key:
                # Get publication ID
                hashnode_pub_id = request_data.hashnode_publication_id or credential.publication_id
                if not hashnode_pub_id:
                    raise ValueError("Hashnode Publication ID required")
                
                api_response = asyncio.run(post_to_hashnode(
                    credential.api_key,
                    hashnode_pub_id,
                    db_post.title,
                    db_post.content_markdown,
                    canonical_url=canonical_url_on_your_site
                ))
                
                post_data = api_response.get("data", {}).get("publishPost", {}).get("post", {})
                
                # Update success
                published_post_entry.platform_post_id = str(post_data.get("id"))
                published_post_entry.platform_post_url = post_data.get("url")
                published_post_entry.status = "success"
                results[platform_name] = {"success": True, "data": api_response}
                
            else:
                raise ValueError(f"Platform {platform_name} not supported or not properly configured")
                
            db.commit()
            
        except Exception as e:
            # Update failure
            if 'published_post_entry' in locals():
                published_post_entry.status = "failed"
                published_post_entry.error_message = str(e)[:500]
                db.commit()
            
            results[platform_name] = {"success": False, "error": str(e)}
    
    # Check if any succeeded
    success_count = sum(1 for result in results.values() if result.get("success"))
    
    return {
        "success": success_count > 0,
        "message": f"Published to {success_count}/{len(valid_platforms)} platforms",
        "results": results,
        "note": "Direct publishing completed (without background tasks)"
    }

# Add PUT for update and DELETE for deletion