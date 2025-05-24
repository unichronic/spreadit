# backend/routers/connections.py
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import httpx # For making external API calls (OAuth)
import os

import schemas, crud, models, security, database  # Fixed imports

router = APIRouter()

# --- Medium OAuth ---
MEDIUM_CLIENT_ID = os.getenv("MEDIUM_CLIENT_ID")
MEDIUM_CLIENT_SECRET = os.getenv("MEDIUM_CLIENT_SECRET")
MEDIUM_REDIRECT_URI = os.getenv("MEDIUM_REDIRECT_URI", "http://localhost:8000/connect/medium/callback") # Your backend callback

@router.get("/medium/login")
async def medium_login(current_user: models.User = Depends(security.get_current_active_user)):
    # Store user_id in session or pass as state if needed, for linking back after callback
    # For simplicity, we assume user is logged in and we link to current_user
    scope = "basicProfile,publishPost"
    # Note: state parameter is crucial for security (CSRF protection)
    auth_url = f"https://medium.com/m/oauth/authorize?client_id={MEDIUM_CLIENT_ID}&scope={scope}&state={current_user.id}&response_type=code&redirect_uri={MEDIUM_REDIRECT_URI}"
    return RedirectResponse(auth_url)

@router.get("/medium/callback")
async def medium_callback(code: str, state: str, # 'state' should be user_id passed earlier
                          db: Session = Depends(database.get_db)):
    user_id = int(state) # Make sure to validate state
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

    if response.status_code != 201: # Medium uses 201 for token creation
        raise HTTPException(status_code=400, detail=f"Failed to get Medium token: {response.text}")

    token_data = response.json()
    cred_data = schemas.PlatformCredentialCreate(
        platform_name="medium",
        access_token=token_data.get("access_token"),
        refresh_token=token_data.get("refresh_token"),
        # expires_at might need calculation based on expires_in
    )
    crud.create_or_update_platform_credential(db, cred=cred_data, user_id=user.id)
    # Redirect user back to a frontend page
    return RedirectResponse(url="http://localhost:3000/dashboard/connections?status=medium_connected")


# --- Dev.to & Hashnode (API Key / PAT) ---
@router.post("/save_key", response_model=schemas.PlatformCredential)
async def save_api_key(
    cred_data: schemas.PlatformCredentialCreate, # Frontend sends platform_name and api_key
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user),
):
    if cred_data.platform_name not in ["dev.to", "hashnode"]:
        raise HTTPException(status_code=400, detail="Invalid platform for API key.")
    if not cred_data.api_key:
        raise HTTPException(status_code=400, detail="API key is required.")

    # You might want to verify the key here by making a simple API call to the platform
    # e.g., fetch user profile to ensure the key is valid

    return crud.create_or_update_platform_credential(db, cred=cred_data, user_id=current_user.id)

@router.post("/{platform}/revoke")
async def revoke_connection(
    platform: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(security.get_current_active_user)
):
    if platform not in ["dev.to", "hashnode", "medium"]:
        raise HTTPException(status_code=400, detail="Invalid platform.")
    
    # Find and delete the platform credential
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
    # Define all available platforms
    available_platforms = ["dev.to", "hashnode", "medium"]
    
    # Get user's credentials
    user_credentials = db.query(models.PlatformCredential).filter_by(user_id=current_user.id).all()
    creds_by_platform = {cred.platform_name: cred for cred in user_credentials}
    
    # Build response with connection status
    connections = []
    for platform in available_platforms:
        cred = creds_by_platform.get(platform)
        is_connected = False
        
        if cred:
            # Check if platform has valid credentials
            if platform in ["dev.to", "hashnode"]:
                is_connected = bool(cred.api_key)
            elif platform == "medium":
                is_connected = bool(cred.access_token)
        
        connections.append({
            "platform_name": platform,
            "is_connected": is_connected
        })
    
    return connections