.PHONY: help dev test test-smoke clean logs build

# Default target
help:
	@echo "Available commands:"
	@echo "  dev         - Start development environment"
	@echo "  test        - Run full test suite"
	@echo "  test-smoke  - Run smoke tests only"
	@echo "  clean       - Stop and remove all containers"
	@echo "  logs        - Show logs from all services"
	@echo "  build       - Build all Docker images"

# Development environment
dev:
	@echo "Starting development environment..."
	docker-compose up -d
	@echo "Services started. Frontend: http://localhost:3000, Backend: http://localhost:8000"

# Full test suite
test:
	@echo "Running full test suite..."
	docker-compose -f compose.test.yml up --build --abort-on-container-exit
	docker-compose -f compose.test.yml down

# Smoke tests only
test-smoke:
	@echo "Running smoke tests..."
	docker-compose -f compose.test.yml up --build cypress --abort-on-container-exit
	docker-compose -f compose.test.yml down

# Clean up
clean:
	@echo "Cleaning up containers and volumes..."
	docker-compose down -v
	docker-compose -f compose.test.yml down -v
	docker system prune -f

# Show logs
logs:
	docker-compose logs -f

# Build images
build:
	@echo "Building all Docker images..."
	docker-compose build
	docker-compose -f compose.test.yml build