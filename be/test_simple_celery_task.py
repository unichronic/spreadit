#!/usr/bin/env python3

from tasks_simple import simple_publish_task

def test_simple_celery_task():
    print("Testing simplified Celery task...")
    
    # Dispatch task
    result = simple_publish_task.delay(user_id=1, post_id=7, platform_name="dev.to")
    print(f"Task ID: {result.id}")
    
    # Wait for result
    try:
        output = result.get(timeout=15)
        print(f"✅ Task result: {output}")
        return True
    except Exception as e:
        print(f"❌ Task failed: {e}")
        return False

if __name__ == "__main__":
    test_simple_celery_task() 