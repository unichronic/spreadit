
from sqlalchemy.orm import Session
import models, schemas, security

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_posts_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Post).filter(models.Post.author_id == user_id).offset(skip).limit(limit).all()

def get_post(db: Session, post_id: int, user_id: int): 
    return db.query(models.Post).filter(models.Post.id == post_id, models.Post.author_id == user_id).first()


def create_user_post(db: Session, post: schemas.PostCreate, user_id: int):
    db_post = models.Post(**post.model_dump(), author_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def update_post(db: Session, post_id: int, user_id: int, post_update: schemas.PostCreate):
    db_post = db.query(models.Post).filter(models.Post.id == post_id, models.Post.author_id == user_id).first()
    if db_post:
        for key, value in post_update.model_dump().items():
            setattr(db_post, key, value)
        db.commit()
        db.refresh(db_post)
    return db_post

def create_or_update_platform_credential(db: Session, cred: schemas.PlatformCredentialCreate, user_id: int):
    db_cred = db.query(models.PlatformCredential).filter_by(user_id=user_id, platform_name=cred.platform_name).first()
    if db_cred: 
        db_cred.access_token = cred.access_token
        db_cred.api_key = cred.api_key
        
    else: 
        db_cred = models.PlatformCredential(**cred.model_dump(), user_id=user_id) 
        db.add(db_cred)
    db.commit()
    db.refresh(db_cred)
    return db_cred

def get_platform_credential(db: Session, user_id: int, platform_name: str):
    return db.query(models.PlatformCredential).filter_by(user_id=user_id, platform_name=platform_name).first()

def get_user_connections(db: Session, user_id: int):
    return db.query(models.PlatformCredential).filter_by(user_id=user_id).all()