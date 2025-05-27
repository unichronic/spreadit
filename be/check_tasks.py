#!/usr/bin/env python3

from celery_utils import celery_app
import tasks

print("Registered tasks:")
for task in sorted(celery_app.tasks.keys()):
    if not task.startswith('celery.'):
        print(f"  {task}")

print(f"\nTotal registered tasks: {len(celery_app.tasks)}")
print(f"Tasks module imported: {'simple_test_task' in dir(tasks)}")
print(f"Publish task imported: {'publish_to_platform_task' in dir(tasks)}") 