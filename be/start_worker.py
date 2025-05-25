
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


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, '..', '.env') 
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH)
else:
    
    load_dotenv()



if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


from celery_utils import celery_app  

if __name__ == '__main__':
    

    argv = [
        'worker',
        '-l', 'info',
  
    ]
    celery_app.worker_main(argv=argv) 