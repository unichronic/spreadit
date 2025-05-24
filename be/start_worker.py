#!/usr/bin/env python3
"""
Celery Worker Startup Script

Run this script to start the Celery worker for background publishing tasks.

Usage:
    python start_worker.py

Make sure Redis is running before starting the worker:
    redis-server

The worker will process publishing tasks in the background.
"""

import os
import sys
from dotenv import load_dotenv

# Load .env file from the project root if it exists
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '..', '.env') # Assuming .env is in project root (one level up from be/)
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH)
else:
    # Fallback to .env in current directory if it exists
    load_dotenv()

# Ensure the backend directory is in the Python path
# This helps Celery find your modules, especially tasks.py
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Import the Celery app instance
from celery_utils import celery_app  # Corrected import

# The worker command arguments
# Example: celery -A your_project.celery_app worker -l info
# We construct this programmatically

# You might need to adjust the app name if Celery complains about module paths
# e.g., if your tasks are in be/tasks.py, Celery might expect something like be.tasks
# However, `celery_utils.celery_app` should point to the instance correctly.

if __name__ == '__main__':
    # It's generally better to run Celery from the command line as shown in README_CELERY.md
    # e.g., celery -A celery_utils.celery_app worker -l info -P eventlet (on Windows)
    # This script is a wrapper if you prefer to run `python start_worker.py`

    # Construct the command arguments for Celery
    # The `-A` flag specifies the application instance
    argv = [
        'worker',
        '-l', 'info',
        # Add other options like -P eventlet for Windows if needed
        # '-P', 'eventlet', # Uncomment if on Windows and using eventlet
    ]
    celery_app.worker_main(argv=argv) 