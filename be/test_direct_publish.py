#!/usr/bin/env python3

import requests
import json

def test_direct_publish():
    print("Testing direct publishing endpoint...")
    
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
    post_data = {
        'title': 'Test Post for Publishing',
        'content_markdown': '# Hello World\n\nThis is a test post for cross-platform publishing.',
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
    
    # Test direct publishing (this should work even without valid API keys, showing validation errors)
    publish_data = {
        'post_id': post_id,
        'platforms': ['dev.to']  # We have a test API key for dev.to
    }
    
    publish_response = requests.post(
        'http://localhost:8000/api/posts/publish-direct',
        headers=headers,
        json=publish_data
    )
    
    print(f"Direct publish status: {publish_response.status_code}")
    
    if publish_response.status_code == 200:
        result = publish_response.json()
        print(f"✅ Direct publishing response:")
        print(json.dumps(result, indent=2))
    else:
        print(f"❌ Direct publishing failed:")
        try:
            error = publish_response.json()
            print(json.dumps(error, indent=2))
        except:
            print(publish_response.text)

if __name__ == "__main__":
    test_direct_publish() 