#!/usr/bin/env python3

from celery_utils import celery_app

@celery_app.task
def simple_test_task(name):
    """Simple test task to verify Celery is working"""
    return f"Hello {name}!"

def test_simple_task():
    print("Testing simple Celery task...")
    
    # Dispatch task
    result = simple_test_task.delay("World")
    print(f"Task ID: {result.id}")
    
    # Wait for result
    try:
        output = result.get(timeout=10)
        print(f"Task result: {output}")
        return True
    except Exception as e:
        print(f"Task failed: {e}")
        return False

if __name__ == "__main__":
    success = test_simple_task()
    if success:
        print("✅ Simple Celery task works!")
    else:
        print("❌ Simple Celery task failed") 