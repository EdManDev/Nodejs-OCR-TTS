# Docker Setup for OCR TTS Server

This document explains how to run the OCR TTS server using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

1. **Clone and navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your specific configuration values.

3. **Start the services:**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations:**
   ```bash
   docker-compose exec server npx prisma migrate deploy
   ```

5. **Access the application:**
   - Server: http://localhost:3000
   - Health check: http://localhost:3000/api/health

## Environment Variables

Create a `.env` file in the server directory with the following variables:

### Required Variables
```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ocr_tts_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Optional Variables
```env
# File Upload Configuration
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads
TEMP_PATH=./temp
STORAGE_TYPE=local

# OCR Configuration
TESSERACT_LANG=eng
OCR_DPI=300

# Text Processing Configuration
MAX_WORDS_PER_CHUNK=1000
OVERLAP_WORDS=50

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Processing Configuration
MAX_CONCURRENT_JOBS=5
JOB_TIMEOUT_MS=300000
CLEANUP_INTERVAL_HOURS=24

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# AWS Configuration (only needed if STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
```

## Services

The Docker Compose setup includes three services:

### 1. PostgreSQL Database (`postgres`)
- **Image:** postgres:15-alpine
- **Port:** 5432
- **Database:** ocr_tts_db
- **User:** postgres
- **Password:** postgres (change in production)

### 2. Redis (`redis`)
- **Image:** redis:7-alpine
- **Port:** 6379
- **Purpose:** Job queue management

### 3. OCR TTS Server (`server`)
- **Build:** Custom Dockerfile
- **Port:** 3000
- **Dependencies:** PostgreSQL and Redis

## Docker Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs server
docker-compose logs postgres
docker-compose logs redis
```

### Execute commands in containers
```bash
# Access server container
docker-compose exec server sh

# Run Prisma commands
docker-compose exec server npx prisma migrate deploy
docker-compose exec server npx prisma generate
docker-compose exec server npx prisma studio
```

### Rebuild and restart
```bash
# Rebuild server image
docker-compose build server

# Restart specific service
docker-compose restart server
```

## Database Management

### Initial Setup
```bash
# Deploy migrations
docker-compose exec server npx prisma migrate deploy

# Generate Prisma client
docker-compose exec server npx prisma generate
```

### Access Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d ocr_tts_db

# Open Prisma Studio
docker-compose exec server npx prisma studio
```

## Volumes

The following directories are mounted as volumes:
- `./uploads` → `/app/uploads` (file uploads)
- `./temp` → `/app/temp` (temporary files)
- `./logs` → `/app/logs` (application logs)

## Health Checks

All services include health checks:
- **PostgreSQL:** `pg_isready` command
- **Redis:** `redis-cli ping` command
- **Server:** HTTP GET to `/api/health`

## Production Considerations

1. **Change default passwords** in the environment variables
2. **Use secrets management** for sensitive data
3. **Configure proper CORS origins**
4. **Set up SSL/TLS** termination
5. **Configure log rotation**
6. **Set up monitoring and alerting**
7. **Use external managed databases** for production

## Troubleshooting

### Common Issues

1. **Port conflicts:** Ensure ports 3000, 5432, and 6379 are available
2. **Permission issues:** Check file permissions for uploads, temp, and logs directories
3. **Database connection:** Verify DATABASE_URL format and credentials
4. **Memory issues:** Increase Docker memory limits for OCR processing

### Debug Commands
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 -f

# Check container resources
docker stats

# Inspect container
docker-compose exec server sh
```
