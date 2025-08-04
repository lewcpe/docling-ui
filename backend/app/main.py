from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Docling File Processor API",
    description="API for processing documents using Docling",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "service": "docling-backend"
    }

@app.get("/api/v1/me")
async def get_current_user():
    """Get current user information from OAuth2 headers"""
    return {
        "email": "test@example.com",
        "authenticated": True
    }

@app.post("/api/v1/files/upload")
async def upload_file():
    """File upload endpoint (placeholder)"""
    return {"error": "No file provided"}, 400

@app.get("/api/v1/files/{file_id}/status")
async def get_file_status(file_id: str):
    """Get file processing status (placeholder)"""
    return {"id": file_id, "status": "completed"}

@app.get("/api/v1/api-keys")
async def list_api_keys():
    """List API keys (placeholder)"""
    return []

@app.post("/api/v1/api-keys")
async def create_api_key():
    """Create API key (placeholder)"""
    return {
        "id": "test-key-id",
        "name": "Test API Key",
        "key": "test-api-key-123"
    }

@app.delete("/api/v1/api-keys/{key_id}")
async def delete_api_key(key_id: str):
    """Delete API key (placeholder)"""
    return {"message": "API key deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)