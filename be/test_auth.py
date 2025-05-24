#!/usr/bin/env python3

import requests
import json

def test_auth():
    print("Testing authentication...")
    
    # Test login
    login_data = {
        'username': 'user@test.com',
        'password': 'password123'
    }
    
    response = requests.post(
        'http://localhost:8000/auth/token',
        data=login_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    print(f"Login status: {response.status_code}")
    
    if response.status_code == 200:
        token_data = response.json()
        print(f"✅ Login successful!")
        print(f"Token: {token_data['access_token'][:50]}...")
        
        # Test protected endpoint
        token = token_data['access_token']
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Test connections endpoint
        conn_response = requests.get(
            'http://localhost:8000/api/connections/',
            headers=headers
        )
        
        print(f"\nConnections endpoint status: {conn_response.status_code}")
        if conn_response.status_code == 200:
            print(f"✅ Connections endpoint works!")
            print(f"Response: {conn_response.json()}")
        else:
            print(f"❌ Connections endpoint failed: {conn_response.text}")
            
    else:
        print(f"❌ Login failed: {response.text}")

if __name__ == "__main__":
    test_auth() 