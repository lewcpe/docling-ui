# Design Document

## Overview

The Docling File Processor is a comprehensive document processing system built as a monorepo with microservices architecture. The system enables users to upload documents (PDF, PNG, JPG) through a web interface, processes them using the Docling API for text extraction, and provides results through multiple channels including database storage and webhook notifications. The architecture emphasizes security through OAuth2-proxy authentication, scalability through queue-based processing, and developer experience through comprehensive testing and containerization.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "External Services"
        OAuth[OAuth2 Provider]
        Docling[Docling API]
        Webhook[User Webhook Endpoints]
    end
    
    subgraph "Infrastructure"
        Nginx[Nginx + OAuth2-Proxy]
    end
    
    subgraph "Application Services"
        Frontend[Next.js Frontend]
        Backend[FastAPI Backend]
        Queue[Redis Queue]
        Worker[Background Workers]
        DB[(PostgreSQL Database)]
    end
    
    subgraph "Testing"
        Cypress[Cypress E2E Tests]
    end
    
    OAuth --> Nginx
    Nginx --> Frontend
    Nginx --> Backend
    Frontend --> Backend
    Backend --> Queue
    Queue --> Worker
    Worker --> Docling
    Worker --> DB
    Worker --> Webhook
    Backend --> DB
    
    Cypress --> Frontend
    Cypress --> Backend
```

### Service Communication

- **Frontend ↔ Backend**: REST API calls with JWT/session authentication
- **Backend ↔ Queue**: Redis-based job queuing with Celery/RQ
- **Worker ↔ Docling**: HTTP API calls to process files
- **Worker ↔ Database**: Direct database connections for result storage
- **Worker ↔ Webhooks**: HTTP POST requests for result delivery
- **Nginx ↔ Services**: OAuth2-proxy integration with header-based authentication forwarding

## Components and Interfaces

### Frontend (Next.js)

**Core Components:**
- **FileUploadComponent**: Drag-and-drop file upload with progress tracking
- **AuthenticationWrapper**: Handles OAuth2 authentication state
- **ProcessingStatusComponent**: Real-time status updates via WebSocket/polling
- **APIKeyManagement**: CRUD interface for API key management
- **WebhookConfiguration**: Interface for webhook endpoint configuration
- **ResultsViewer**: Display processed text results with search/filter capabilities

**Key Features:**
- Responsive design with mobile support
- Real-time updates using WebSocket connections
- File validation (type, size) before upload
- Progress indicators for upload and processing
- Error handling with user-friendly messages

**API Integration:**
```typescript
// File upload interface
interface FileUploadRequest {
  files: File[];
  webhookUrl?: string;
  processingOptions?: DoclingProcessingOptions;
}

// Processing status interface
interface ProcessingStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: ProcessedFileResult;
  error?: string;
}
```

### Backend (FastAPI)

**Core Modules:**

1. **Authentication Module**
   - X-Forwarded-Email header validation from nginx/OAuth2-proxy
   - API key generation and validation
   - User session management
   - JWT token handling for API access
   - Unified user identification across authentication methods

2. **File Processing Module**
   - File upload handling with validation
   - Queue job creation and management
   - Status tracking and updates
   - Result retrieval and formatting

3. **API Key Management Module**
   - Secure key generation using cryptographic libraries
   - Key storage with hashing (bcrypt/argon2)
   - Key validation and rate limiting
   - Key lifecycle management (creation, revocation)

4. **Webhook Module**
   - Webhook URL validation and storage
   - Delivery queue management
   - Retry logic with exponential backoff
   - Delivery status tracking

**API Endpoints:**
```python
# Core endpoints
POST /api/v1/files/upload          # File upload
GET  /api/v1/files/{id}/status     # Processing status
GET  /api/v1/files/{id}/result     # Retrieve results
GET  /api/v1/files                 # List user files

# API Key management
POST /api/v1/api-keys              # Create API key
GET  /api/v1/api-keys              # List API keys
DELETE /api/v1/api-keys/{id}       # Revoke API key

# Webhook management
POST /api/v1/webhooks              # Set webhook URL
GET  /api/v1/webhooks              # Get webhook config
DELETE /api/v1/webhooks            # Remove webhook

# User information
GET  /api/v1/me                    # Get current user info

# Health and monitoring
GET  /health                       # Health check
GET  /metrics                      # Prometheus metrics
```

### Background Workers

**Queue Processing Architecture:**
- **Redis** as message broker for job queuing
- **Celery** for distributed task processing
- **Worker pools** for parallel processing
- **Dead letter queues** for failed job handling

**Worker Tasks:**
1. **File Processing Task**
   - Download file from temporary storage
   - Call Docling API with appropriate parameters
   - Handle API responses and errors
   - Store results in database
   - Trigger webhook delivery if configured

2. **Webhook Delivery Task**
   - Prepare webhook payload
   - Attempt delivery with timeout handling
   - Implement retry logic (exponential backoff)
   - Log delivery status and failures

**Docling API Integration:**
```python
# Docling API client configuration
class DoclingClient:
    def process_file(self, file_path: str, options: ProcessingOptions) -> ProcessingResult:
        # POST to /v1/convert/file endpoint
        # Handle multipart/form-data upload
        # Process response and extract text
        # Return structured result
```

### Database Schema (PostgreSQL)

**Core Tables:**

```sql
-- Users table (populated from OAuth2 headers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Webhook configurations
CREATE TABLE webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    secret VARCHAR(255), -- For webhook signature verification
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File processing jobs
CREATE TABLE processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

-- Processing results
CREATE TABLE processing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    extracted_text TEXT NOT NULL,
    metadata JSONB, -- Store Docling response metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook delivery logs
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    webhook_url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'pending', 'delivered', 'failed'
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    response_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Data Models

### Core Data Models

```python
# Pydantic models for API contracts
class FileUploadRequest(BaseModel):
    files: List[UploadFile]
    webhook_url: Optional[str] = None
    processing_options: Optional[DoclingProcessingOptions] = None

class ProcessingJob(BaseModel):
    id: UUID
    user_id: UUID
    original_filename: str
    file_type: str
    file_size: int
    status: ProcessingStatus
    progress: int
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]

class ProcessingResult(BaseModel):
    id: UUID
    job_id: UUID
    extracted_text: str
    metadata: Dict[str, Any]
    created_at: datetime

class APIKey(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    key_preview: str  # First 8 chars + "..."
    created_at: datetime
    last_used_at: Optional[datetime]
    is_active: bool

class WebhookConfig(BaseModel):
    id: UUID
    user_id: UUID
    url: str
    secret: Optional[str]
    is_active: bool
    created_at: datetime

class UserInfo(BaseModel):
    id: UUID
    email: str
    created_at: datetime
    authentication_method: str  # "oauth2" or "api_key"
    api_key_name: Optional[str]  # If authenticated via API key
```

### Docling Integration Models

```python
class DoclingProcessingOptions(BaseModel):
    to_formats: List[str] = ["md", "text"]
    do_ocr: bool = True
    ocr_engine: str = "easyocr"
    include_images: bool = True
    do_table_structure: bool = True

class DoclingResponse(BaseModel):
    document: Dict[str, Any]
    status: str
    processing_time: float
    errors: List[Dict[str, Any]] = []
```

## Error Handling

### Error Categories and Responses

1. **Authentication Errors**
   - Missing OAuth2 headers: 401 Unauthorized
   - Invalid API keys: 401 Unauthorized
   - Expired sessions: 401 Unauthorized

2. **Validation Errors**
   - Invalid file types: 400 Bad Request
   - File size limits exceeded: 413 Payload Too Large
   - Invalid webhook URLs: 400 Bad Request

3. **Processing Errors**
   - Docling API failures: 502 Bad Gateway
   - Queue connection issues: 503 Service Unavailable
   - Database connection issues: 503 Service Unavailable

4. **Rate Limiting**
   - API rate limits exceeded: 429 Too Many Requests
   - File upload limits: 429 Too Many Requests

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only PDF, PNG, and JPG files are supported",
    "details": {
      "supported_types": ["pdf", "png", "jpg"],
      "received_type": "docx"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

### Retry and Recovery Strategies

- **Docling API calls**: Exponential backoff with jitter (max 5 retries)
- **Webhook deliveries**: Exponential backoff (1min, 5min, 15min, 1hr, 6hr)
- **Database operations**: Connection pooling with automatic reconnection
- **Queue processing**: Dead letter queues for failed jobs

## Testing Strategy

### Testing Pyramid

1. **Unit Tests**
   - Backend API endpoints (FastAPI TestClient)
   - Database models and operations (pytest with test database)
   - Authentication and authorization logic
   - File validation and processing logic
   - Webhook delivery mechanisms

2. **Integration Tests**
   - Docling API integration (with mocking for CI)
   - Database integration tests
   - Queue processing workflows
   - OAuth2-proxy integration

3. **End-to-End Tests (Cypress)**
   - Complete user workflows from upload to result retrieval
   - Authentication flows
   - API key management workflows
   - Webhook configuration and delivery
   - Error handling scenarios

### Test Environment Configuration

**Docker Compose Testing Profile:**
```yaml
# docker-compose.test.yml
services:
  test-db:
    image: postgres:16
    environment:
      POSTGRES_DB: docling_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
    
  test-redis:
    image: redis:7-alpine
    
  test-backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://test_user:test_pass@test-db:5432/docling_test
      REDIS_URL: redis://test-redis:6379
      TESTING: true
    depends_on:
      - test-db
      - test-redis
    
  cypress:
    image: cypress/included:latest
    volumes:
      - ./cypress:/cypress
      - ./cypress/videos:/cypress/videos
      - ./cypress/screenshots:/cypress/screenshots
    environment:
      CYPRESS_BASE_URL: http://test-frontend:3000
      CYPRESS_API_URL: http://test-backend:8000
    depends_on:
      - test-frontend
      - test-backend
```

### Test Data Management

- **Database fixtures**: Automated test data seeding
- **File fixtures**: Sample PDF, PNG, JPG files for testing
- **Mock services**: Docling API mocking for consistent testing
- **User fixtures**: Test users with various permission levels

### Continuous Integration

- **GitHub Actions** or similar CI/CD pipeline
- **Automated testing** on pull requests
- **Test coverage reporting** with minimum thresholds
- **Security scanning** for dependencies and containers
- **Performance testing** for file processing workflows

## Security Considerations

### Authentication and Authorization

- **Nginx with OAuth2-proxy** handles external authentication and request routing
- **API keys** use cryptographically secure generation
- **Rate limiting** implemented at nginx level prevents abuse
- **CORS configuration** restricts frontend access

### Data Protection

- **File encryption** in temporary storage
- **Database encryption** at rest
- **Webhook signature verification** using HMAC
- **Secure API key storage** with hashing

### Infrastructure Security

- **Container security** with minimal base images
- **Network segmentation** between services
- **Secrets management** using environment variables
- **Regular security updates** for dependencies

## Deployment and Operations

### Container Configuration

Each service runs in its own container with:
- **Health checks** for monitoring
- **Resource limits** for stability
- **Logging configuration** for observability
- **Environment-based configuration** for flexibility

### Monitoring and Observability

- **Prometheus metrics** for system monitoring
- **Structured logging** with correlation IDs
- **Health check endpoints** for load balancer integration
- **Performance monitoring** for Docling API calls

### Scalability Considerations

- **Horizontal scaling** for worker processes
- **Database connection pooling** for efficiency
- **Redis clustering** for queue scalability
- **CDN integration** for static asset delivery