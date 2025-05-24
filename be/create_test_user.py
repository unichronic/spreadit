#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
import models
import crud
import schemas
from security import get_password_hash

def main():
    # Create database tables
    models.Base.metadata.create_all(bind=database.engine)
    
    # Create session
    db = database.SessionLocal()
    
    try:
        # Check if any users exist
        users = db.query(models.User).all()
        print(f"Found {len(users)} users in database:")
        for user in users:
            print(f"  - {user.email} (ID: {user.id})")
        
        # Create test user if it doesn't exist
        test_email = "user@test.com"
        test_password = "password123"
        
        existing_user = crud.get_user_by_email(db, test_email)
        if not existing_user:
            print(f"\nCreating test user: {test_email}")
            user_create = schemas.UserCreate(email=test_email, password=test_password)
            new_user = crud.create_user(db, user_create)
            print(f"✅ Created user: {new_user.email}")
        else:
            print(f"\n✅ Test user already exists: {existing_user.email}")
        
        # Test token generation
        from security import create_access_token
        from datetime import timedelta
        
        user = crud.get_user_by_email(db, test_email)
        if user:
            token = create_access_token(
                data={"sub": user.email}, 
                expires_delta=timedelta(minutes=30)
            )
            print(f"\n✅ Generated token: {token[:50]}...")
            print(f"✅ Token for user: {user.email}")
        
        print("\n🎉 Database setup complete!")
        print(f"You can now login with:")
        print(f"  Email: {test_email}")
        print(f"  Password: {test_password}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main() 