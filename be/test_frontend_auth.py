#!/usr/bin/env python3

import requests
import json

def test_frontend_auth_flow():
    print("Testing frontend authentication flow...")
    
    # Step 1: Login to get token
    print("1. Logging in...")
    login_response = requests.post(
        'http://localhost:8000/auth/token',
        data={'username': 'user@test.com', 'password': 'password123'},
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token_data = login_response.json()
    token = token_data['access_token']
    print(f"✅ Login successful! Token: {token[:50]}...")
    
    # Step 2: Test connections endpoint (what frontend calls)
    print("\n2. Testing connections endpoint...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    connections_response = requests.get(
        'http://localhost:8000/api/connections/',
        headers=headers
    )
    
    print(f"Connections status: {connections_response.status_code}")
    if connections_response.status_code == 200:
        print(f"✅ Connections endpoint works!")
        print(f"Response: {connections_response.json()}")
    else:
        print(f"❌ Connections endpoint failed: {connections_response.text}")
    
    # Step 3: Test posts endpoint
    print("\n3. Testing posts endpoint...")
    posts_response = requests.get(
        'http://localhost:8000/api/posts/',
        headers=headers
    )
    
    print(f"Posts status: {posts_response.status_code}")
    if posts_response.status_code == 200:
        print(f"✅ Posts endpoint works!")
        posts = posts_response.json()
        print(f"Found {len(posts)} posts")
    else:
        print(f"❌ Posts endpoint failed: {posts_response.text}")
    
    # Step 4: Test with different header formats (debug frontend issues)
    print("\n4. Testing different header formats...")
    
    # Test without Bearer prefix
    bad_headers_1 = {
        'Authorization': token,  # Missing 'Bearer '
        'Content-Type': 'application/json'
    }
    
    test_response_1 = requests.get(
        'http://localhost:8000/api/connections/',
        headers=bad_headers_1
    )
    print(f"Without 'Bearer ': {test_response_1.status_code}")
    
    # Test with null token
    bad_headers_2 = {
        'Authorization': 'Bearer null',
        'Content-Type': 'application/json'
    }
    
    test_response_2 = requests.get(
        'http://localhost:8000/api/connections/',
        headers=bad_headers_2
    )
    print(f"With 'Bearer null': {test_response_2.status_code}")
    
    # Test with empty token
    bad_headers_3 = {
        'Authorization': 'Bearer ',
        'Content-Type': 'application/json'
    }
    
    test_response_3 = requests.get(
        'http://localhost:8000/api/connections/',
        headers=bad_headers_3
    )
    print(f"With empty token: {test_response_3.status_code}")

if __name__ == "__main__":
    test_frontend_auth_flow() 