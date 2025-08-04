from celery import Celery
import os

# Create Celery instance
celery_app = Celery(
    "docling_worker",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379")
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@celery_app.task
def process_document(file_path: str, user_id: str):
    """Process a document using Docling API"""
    # Placeholder task
    return {
        "status": "completed",
        "file_path": file_path,
        "user_id": user_id,
        "extracted_text": "Sample extracted text"
    }