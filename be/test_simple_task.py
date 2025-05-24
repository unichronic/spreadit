#!/usr/bin/env python3

from tasks import simple_test_task

def test_simple_task():
    print("Testing simple Celery task from tasks.py...")
    
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