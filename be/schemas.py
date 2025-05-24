# backend/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True # Changed from from_attributes = True for Pydantic v1 compatibility

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Post Schemas (example)
class PostBase(BaseModel):
    title: str
    content_markdown: str

class PostCreate(PostBase):
    pass

class Post(PostBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        orm_mode = True

# Publish Schemas
class PublishRequest(BaseModel):
    platforms: List[str]  # e.g., ["dev.to", "hashnode", "medium"]
    canonical_url: Optional[str] = None
    tags: Optional[List[str]] = None

# PlatformCredential Schemas
class PlatformCredentialBase(BaseModel):
    platform_name: str
    access_token: Optional[str] = None
    api_key: Optional[str] = None
    # Add other fields you expect from the frontend

class PlatformCredentialCreate(PlatformCredentialBase):
    pass

class PlatformCredential(PlatformCredentialBase):
    id: int
    user_id: int
    class Config:
        orm_mode = True

class PostToPlatformsRequest(BaseModel):
    post_id: int
    platforms: List[str]
    canonical_url: Optional[str] = None
    tags: Optional[List[str]] = None
    hashnode_publication_id: Optional[str] = None