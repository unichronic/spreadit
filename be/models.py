
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    posts = relationship("Post", back_populates="author")
    platform_credentials = relationship("PlatformCredential", back_populates="user")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content_markdown = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    
    
    
    
    

    author = relationship("User", back_populates="posts")
    published_posts = relationship("PublishedPost", back_populates="original_post")


class PlatformCredential(Base):
    __tablename__ = "platform_credentials"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    platform_name = Column(String, nullable=False) 
    access_token = Column(String, nullable=True) 
    api_key = Column(String, nullable=True) 
    refresh_token = Column(String, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    
    platform_data = Column(JSON, nullable=True) 
    
    
    publication_id = Column(String, nullable=True) 
    platform_user_id = Column(String, nullable=True) 

    user = relationship("User", back_populates="platform_credentials")

class PublishedPost(Base): 
    __tablename__ = "published_posts"
    id = Column(Integer, primary_key=True, index=True)
    original_post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    platform_name = Column(String, nullable=False)
    platform_post_id = Column(String, nullable=True) 
    platform_post_url = Column(String, nullable=True)
    status = Column(String, default="pending") 
    error_message = Column(Text, nullable=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now())

    original_post = relationship("Post", back_populates="published_posts")