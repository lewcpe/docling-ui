# Docling File Processor

A comprehensive document processing system that allows users to upload documents (PDF, PNG, JPG) through a web interface, processes them using the Docling API, and provides results through database storage and webhook notifications.

## Architecture

This is a monorepo containing:
- **Backend**: FastAPI application with Celery workers
- **Frontend**: Next.js React application
- **Infrastructure**: Nginx with OAuth2-proxy integration
- **Cypress**: End-to-end testing suite

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Development Setup

1. **Clone and setup environment**:
   ```bash
   git clone <repository-url>
   cd docling-file-processor
   cp .env.example .env
   ```

2. **Start development services**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Testing Setup

1. **Run the test suite**:
   ```bash
   docker-compose -f compose.test.yml up --build
   ```

2. **Run Cypress tests interactively** (requires X11 forwarding on Linux):
   ```bash
   docker-compose -f compose.test.yml --profile interactive up cypress-open
   ```

3. **Run smoke tests only**:
   ```bash
   docker-compose -f compose.test.yml up --build cypress
   ```

## Project Structure

```
├── backend/                 # FastAPI backend service
│   ├── app/                # Application code
│   ├── database/           # Database initialization scripts
│   ├── Dockerfile          # Production Docker image
│   ├── Dockerfile.test     # Test Docker image
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend service
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── Dockerfile         # Production Docker image
│   ├── Dockerfile.test    # Test Docker image
│   └── package.json       # Node.js dependencies
├── infrastructure/        # Infrastructure configuration
│   └── nginx/            # Nginx configuration
├── cypress/              # End-to-end testing
│   ├── e2e/             # Test specifications
│   ├── fixtures/        # Test data and files
│   ├── mocks/           # Mock services
│   └── support/         # Test utilities
├── compose.yml          # Development Docker Compose
├── compose.test.yml     # Testing Docker Compose
└── README.md           # This file
```

## Services

### Backend (FastAPI)
- **Port**: 8000
- **Health Check**: http://localhost:8000/health
- **API Documentation**: http://localhost:8000/docs
- **Features**: File upload, processing queue, API key management, webhooks

### Frontend (Next.js)
- **Port**: 3000
- **Features**: File upload UI, processing status, API key management, webhook configuration

### Database (PostgreSQL)
- **Port**: 5432
- **Database**: docling_processor
- **Features**: User data, processing jobs, results, webhook configurations

### Queue (Redis)
- **Port**: 6379
- **Features**: Background job processing, task queuing

### Nginx
- **Port**: 80
- **Features**: Reverse proxy, OAuth2-proxy integration, rate limiting

## Testing

### Test Environment

The test environment includes:
- Isolated test database (PostgreSQL on port 5433)
- Test Redis instance (port 6380)
- Mock Docling API service
- Cypress test runner with custom commands

### Running Tests

```bash
# Run all tests
docker-compose -f compose.test.yml up --build

# Run specific test file
docker-compose -f compose.test.yml up --build cypress -c "npx cypress run --spec 'cypress/e2e/smoke.cy.js'"

# Interactive testing (development)
docker-compose -f compose.test.yml --profile interactive up cypress-open
```

### Test Files

- **Smoke Tests**: `cypress/e2e/smoke.cy.js` - Verifies basic system functionality
- **Sample Files**: `cypress/fixtures/` - Contains test PDF, PNG, and JPG files
- **Mock API**: `cypress/mocks/` - Mock Docling API for consistent testing

## Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# Database
POSTGRES_DB=docling_processor
POSTGRES_USER=docling_user
POSTGRES_PASSWORD=docling_pass

# API
DOCLING_API_URL=http://localhost:8080
SECRET_KEY=your-secret-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Make changes** to code in respective directories
3. **Test changes**: `docker-compose -f compose.test.yml up --build`
4. **View logs**: `docker-compose logs -f [service-name]`
5. **Stop services**: `docker-compose down`

## API Endpoints

### Authentication
- `GET /api/v1/me` - Get current user information

### File Processing
- `POST /api/v1/files/upload` - Upload files for processing
- `GET /api/v1/files/{id}/status` - Get processing status
- `GET /api/v1/files/{id}/result` - Get processing results
- `GET /api/v1/files` - List user's files

### API Key Management
- `POST /api/v1/api-keys` - Create API key
- `GET /api/v1/api-keys` - List API keys
- `DELETE /api/v1/api-keys/{id}` - Delete API key

### Webhook Management
- `POST /api/v1/webhooks` - Configure webhook
- `GET /api/v1/webhooks` - Get webhook configuration
- `DELETE /api/v1/webhooks` - Remove webhook

## Troubleshooting

### Common Issues

1. **Services not starting**: Check Docker daemon and port availability
2. **Database connection errors**: Ensure PostgreSQL container is healthy
3. **File upload failures**: Check file size limits and disk space
4. **Test failures**: Verify test database is clean and services are running

### Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/api/health

# Database connectivity
docker-compose exec postgres pg_isready -U docling_user -d docling_processor
```

## Contributing

1. Follow the existing code structure and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting changes

## License

[Add your license information here]