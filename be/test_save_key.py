#!/usr/bin/env python3

import requests
import json

def test_save_key():
    print("Testing save_key endpoint...")
    
    # First login to get a token
    login_data = {
        'username': 'user@test.com',
        'password': 'password123'
    }
    
    response = requests.post(
        'http://localhost:8000/auth/token',
        data=login_data
    )
    
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
        
    token = response.json()['access_token']
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test saving an API key for dev.to
    save_key_data = {
        'platform_name': 'dev.to',
        'api_key': 'test-api-key-12345'
    }
    
    save_response = requests.post(
        'http://localhost:8000/api/connections/save_key',
        headers=headers,
        json=save_key_data
    )
    
    print(f"Save key status: {save_response.status_code}")
    
    if save_response.status_code == 200:
        print(f"✅ API key saved successfully!")
        print(f"Response: {save_response.json()}")
        
        # Check connections to see if it's now connected
        conn_response = requests.get(
            'http://localhost:8000/api/connections/',
            headers=headers
        )
        
        if conn_response.status_code == 200:
            connections = conn_response.json()
            devto_conn = next((c for c in connections if c['platform_name'] == 'dev.to'), None)
            if devto_conn and devto_conn['is_connected']:
                print("✅ Dev.to now shows as connected!")
            else:
                print("❌ Dev.to still shows as not connected")
            print(f"All connections: {connections}")
        
    else:
        print(f"❌ Save key failed: {save_response.text}")

if __name__ == "__main__":
    test_save_key() 