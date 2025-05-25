
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import httpx 
import os
import asyncio
from services.posting_service import get_hashnode_publication_id, get_hashnode_user_publications

import schemas, crud, models, security, database  

router = APIRouter()


MEDIUM_CLIENT_ID = os.getenv("MEDIUM_CLIENT_ID")
MEDIUM_CLIENT_SECRET = os.getenv("MEDIUM_CLIENT_SECRET")
MEDIUM_REDIRECT_URI = os.getenv("MEDIUM_REDIRECT_URI", "http://localhost:8000/connect/medium/callback") 

@router.get("/medium/login")
async def medium_login(current_user: models.User = Depends(security.get_current_active_user)):
    
    
    scope = "basicProfile,publishPost"
    
    auth_url = f"https://medium.com/m/oauth/authorize?client_id={MEDIUM_CLIENT_ID}&scope={scope}&state={current_user.id}&response_type=code&redirect_uri={MEDIUM_REDIRECT_URI}"
    return RedirectResponse(auth_url)

@router.get("/medium/callback")
async def medium_callback(code: str, state: str, 
                          db: Session = Depends(database.get_db)):
    user_id = int(state) 
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found for state")

    token_url = "https://api.medium.com/v1/tokens"
    payload = {
        "code": code,
        "client_id": MEDIUM_CLIENT_ID,
        "client_secret": MEDIUM_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "redirect_uri": MEDIUM_REDIRECT_URI,
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=payload)

    if response.status_code != 201: 
        raise HTTPException(status_code=400, detail=f"Failed to get Medium token: {response.text}")

    token_data = response.json()
    cred_data = schemas.PlatformCredentialCreate(
        platform_name="medium",
        access_token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        
    )
    crud.create_or_update_platform_credential(db, cred=cred_data, user_id=user.id)
    
    return RedirectResponse(url="http://localhost:3000/dashboard/connections?status=medium_connected")



@router.post("/save_key", response_model=schemas.PlatformCredential)
async def save_api_key(
    cred_data: schemas.PlatformCredentialCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    if cred_data.platform_name not in ["dev.to", "hashnode"]:
        raise HTTPException(status_code=400, detail="Invalid platform for API key.")
    if not cred_data.api_key:
        raise HTTPException(status_code=400, detail="API key is required.")

    
    publication_id = None
    if cred_data.platform_name == "hashnode":
        try:
            
            user_publications = await get_hashnode_user_publications(cred_data.api_key)
            if user_publications:
                
                publication_id = user_publications[0]["id"]
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="No Hashnode publications found. Please create a publication on Hashnode first."
                )
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to verify Hashnode API key or fetch publication: {str(e)}"
            )

    
    try:
        credential = crud.get_platform_credential(db, user_id=current_user.id, platform_name=cred_data.platform_name)
        
        if credential:
            
            credential.api_key = cred_data.api_key
            if publication_id:
                credential.publication_id = publication_id
        else:
            
            credential = models.PlatformCredential(
                user_id=current_user.id,
                platform_name=cred_data.platform_name,
                api_key=cred_data.api_key,
                publication_id=publication_id
            )
            db.add(credential)
        
        db.commit()
        db.refresh(credential)
        
        return credential
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to save credential: {str(e)}"
        )

@router.post("/{platform}/revoke")
async def revoke_connection(
    platform: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    if platform not in ["dev.to", "hashnode", "medium"]:
        raise HTTPException(status_code=400, detail="Invalid platform.")
    
    
    cred = db.query(models.PlatformCredential).filter_by(
        user_id=current_user.id, 
        platform_name=platform
    ).first()
    
    if not cred:
        raise HTTPException(status_code=404, detail=f"No connection found for {platform}")
    
    db.delete(cred)
    db.commit()
    
    return {"message": f"Successfully revoked connection to {platform}"}

@router.get("/")
async def get_connections(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    
    available_platforms = ["dev.to", "hashnode", "medium"]
    
    
    user_credentials = db.query(models.PlatformCredential).filter_by(user_id=current_user.id).all()
    creds_by_platform = {cred.platform_name: cred for cred in user_credentials}
    
    
    connections = []
    for platform in available_platforms:
        cred = creds_by_platform.get(platform)
        is_connected = False
        
        if cred:
            
            if platform in ["dev.to", "hashnode"]:
                is_connected = bool(cred.api_key)
            elif platform == "medium":
                is_connected = bool(cred.access_token)
        
        connections.append({
            "platform_name": platform,
            "is_connected": is_connected
        })
    
    return connections