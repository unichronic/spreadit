#!/usr/bin/env python3

import requests
import json
import traceback

def debug_publish_task():
    print("Debugging publish task execution...")
    
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
    
    # Test direct publishing first to ensure the API logic works
    print("🔧 Testing direct publishing first...")
    publish_data = {
        'post_id': 7,  # Use the post we created earlier
        'platforms': ['dev.to']
    }
    
    direct_response = requests.post(
        'http://localhost:8000/api/posts/publish-direct',
        headers=headers,
        json=publish_data
    )
    
    print(f"Direct publish status: {direct_response.status_code}")
    if direct_response.status_code == 200:
        result = direct_response.json()
        print("✅ Direct publishing works")
        print(f"Result: {result.get('message', 'No message')}")
    else:
        print("❌ Direct publishing failed:")
        try:
            error = direct_response.json()
            print(json.dumps(error, indent=2))
        except:
            print(direct_response.text)
    
    print("\n" + "="*50)
    
    # Now test Celery publishing 
    print("🚀 Testing Celery publishing...")
    celery_response = requests.post(
        'http://localhost:8000/api/posts/publish',
        headers=headers,
        json=publish_data
    )
    
    print(f"Celery publish status: {celery_response.status_code}")
    if celery_response.status_code == 200:
        result = celery_response.json()
        print("✅ Celery task dispatched successfully")
        print(f"Task IDs: {result.get('task_ids', {})}")
        
        # Check task details
        if 'task_ids' in result:
            for platform, task_id in result['task_ids'].items():
                print(f"\n📋 Checking task {platform} ({task_id})...")
                
                # Get task status with detailed info
                status_response = requests.get(
                    f'http://localhost:8000/api/tasks/status/{task_id}',
                    headers=headers
                )
                
                if status_response.status_code == 200:
                    status = status_response.json()
                    print(f"  Status: {status.get('status', 'Unknown')}")
                    print(f"  Ready: {status.get('ready', False)}")
                    print(f"  Successful: {status.get('successful', None)}")
                    print(f"  Failed: {status.get('failed', None)}")
                    
                    if status.get('error'):
                        print(f"  Error: {status['error']}")
                    if status.get('result'):
                        print(f"  Result: {status['result']}")
                else:
                    print(f"  ❌ Could not get task status: {status_response.status_code}")
    else:
        print("❌ Celery task dispatch failed:")
        try:
            error = celery_response.json()
            print(json.dumps(error, indent=2))
        except:
            print(celery_response.text)

if __name__ == "__main__":
    try:
        debug_publish_task()
    except Exception as e:
        print(f"❌ Script failed: {e}")
        traceback.print_exc() 