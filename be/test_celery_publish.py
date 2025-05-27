#!/usr/bin/env python3

import requests
import json
import time

def test_celery_publish():
    print("Testing Celery publishing endpoint...")
    
    # Login first
    login_response = requests.post(
        'http://localhost:8000/auth/token',
        data={'username': 'user@test.com', 'password': 'password123'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()['access_token']
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Create a test post first
    print("📝 Creating a test post...")
    post_data = {
        'title': 'Test Post for Celery Publishing',
        'content_markdown': '# Hello World\n\nThis is a test post for Celery-based cross-platform publishing.',
        'is_draft': False
    }
    
    create_response = requests.post(
        'http://localhost:8000/api/posts',
        headers=headers,
        json=post_data
    )
    
    if create_response.status_code != 200:
        print(f"❌ Failed to create post: {create_response.text}")
        return
    
    post = create_response.json()
    post_id = post['id']
    print(f"✅ Created test post with ID: {post_id}")
    
    # Test Celery publishing
    publish_data = {
        'post_id': post_id,
        'platforms': ['dev.to']
    }
    
    print("🚀 Attempting to publish via Celery...")
    publish_response = requests.post(
        'http://localhost:8000/api/posts/publish',
        headers=headers,
        json=publish_data
    )
    
    print(f"Publish status: {publish_response.status_code}")
    
    if publish_response.status_code == 200:
        result = publish_response.json()
        print(f"✅ Celery publishing successful!")
        print(json.dumps(result, indent=2))
        
        # Check if we got task IDs
        if 'task_ids' in result:
            print(f"\n📋 Task IDs received: {result['task_ids']}")
            
            # Wait a moment and check task status
            print("⏳ Waiting 3 seconds before checking task status...")
            time.sleep(3)
            for platform, task_id in result['task_ids'].items():
                status_response = requests.get(
                    f'http://localhost:8000/api/tasks/status/{task_id}',
                    headers=headers
                )
                if status_response.status_code == 200:
                    status = status_response.json()
                    print(f"📊 Task {platform} ({task_id[:8]}...): {status['status']}")
                    if status.get('ready'):
                        print(f"   Result: {status.get('result', 'N/A')}")
                    if status.get('failed'):
                        print(f"   Error: {status.get('error', 'N/A')}")
                else:
                    print(f"❌ Could not get status for task {task_id}: {status_response.status_code}")
        
    else:
        print(f"❌ Celery publishing failed:")
        try:
            error = publish_response.json()
            print(json.dumps(error, indent=2))
        except:
            print(publish_response.text)

if __name__ == "__main__":
    test_celery_publish() 