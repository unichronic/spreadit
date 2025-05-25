
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    class Config:
        orm_mode = True 

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

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


class PublishRequest(BaseModel):
    platforms: List[str]  
    canonical_url: Optional[str] = None
    tags: Optional[List[str]] = None

class PlatformCredentialBase(BaseModel):
    platform_name: str
    access_token: Optional[str] = None
    api_key: Optional[str] = None
    

class PlatformCredentialCreate(PlatformCredentialBase):
    pass

class PlatformCredential(PlatformCredentialBase):
    id: int
    user_id: int
    publication_id: Optional[str] = None
    platform_user_id: Optional[str] = None
    class Config:
        orm_mode = True

class PostToPlatformsRequest(BaseModel):
    post_id: int
    platforms: List[str]
    canonical_url: Optional[str] = None
    tags: Optional[List[str]] = None
    hashnode_publication_id: Optional[str] = None