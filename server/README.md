# Node.js OCR TTS Backend

A robust, production-ready Node.js + TypeScript backend application for PDF Optical Character Recognition (OCR) and Text-to-Speech (TTS) processing. This application efficiently processes large PDF files (up to 1000+ pages), extracts text using advanced OCR, and prepares it for TTS usage with intelligent chunking strategies.

## 🚀 Features

- **Large PDF Processing**: Handle PDFs up to 1000+ pages without memory issues
- **Advanced OCR Engine**: Extract text from both digital and scanned PDFs using Tesseract.js
- **Intelligent Text Chunking**: Smart text segmentation optimized for TTS processing
- **Asynchronous Processing**: Queue-based processing with Bull and Redis for scalability
- **Scalable Architecture**: Memory-efficient streaming and configurable batching
- **Dual Storage Support**: Local filesystem and AWS S3 storage options
- **Comprehensive API**: RESTful endpoints with proper error handling and validation
- **Security**: File validation, rate limiting, CORS, and secure uploads
- **Advanced Monitoring**: Structured logging, health checks, and performance metrics
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Database Management**: PostgreSQL with Prisma ORM for robust data persistence
- **Job Queue Management**: Real-time job monitoring and cancellation capabilities

## 📋 Prerequisites

- **Node.js**: Version 18.0 or higher
- **PostgreSQL**: Version 12 or higher
- **Redis**: Version 6.0 or higher (for job queue)
- **npm** or **yarn** package manager

### Optional Dependencies
- **AWS Account**: For S3 storage (if not using local storage)
- **Tesseract**: For improved OCR performance (automatically installed with tesseract.js)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd nodejs-ocr-tts/server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ocr_tts_db"

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# File Storage Configuration
STORAGE_TYPE=local
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads
TEMP_PATH=./temp

# AWS S3 Configuration (if using S3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=

# OCR Configuration
TESSERACT_LANG=eng
OCR_DPI=300
MAX_PAGES_PER_BATCH=10

# Text Chunking Configuration
MAX_WORDS_PER_CHUNK=1000
OVERLAP_WORDS=50

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
ENABLE_FILE_LOGGING=false

# Processing Configuration
MAX_CONCURRENT_JOBS=5
JOB_TIMEOUT_MS=300000
CLEANUP_INTERVAL_HOURS=24
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Optional: Open Prisma Studio
npm run db:studio
```

### 5. Create Required Directories
```bash
mkdir uploads temp logs
```

## 🗄️ Database Setup & Management

### 1. Automatic Database Setup (Recommended)
To automatically create the database and set permissions, run:
```bash
npm run setup-database
```
This script will create the `ocr_tts_db` database (if it doesn't exist) and grant all privileges to the `postgres` user.

### 2. Prisma Studio (Visual DB Browser)
To visually inspect and edit your database, run:
```bash
npx prisma studio
```

### 3. Resetting the Database (Development Only)
To reset your database and reapply all migrations:
```bash
npx prisma migrate reset
```

## ⚠️ Prisma & PostgreSQL Troubleshooting
- **Permission Denied / Access Errors:**
  - Ensure your `.env` has the correct `DATABASE_URL`
  - Run `npm run setup-database` to fix permissions
- **psql Not Found:**
  - Use the provided Node.js setup script or a GUI tool like pgAdmin
- **Migration Errors:**
  - Make sure PostgreSQL is running and accessible on `localhost:5432`
  - Check that your user has privileges on the `ocr_tts_db` database

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📡 API Endpoints

### Document Management

#### Upload PDF Document
```http
POST /api/documents/upload
Content-Type: multipart/form-data

Form Data:
- file: PDF file (required)
- ocrLanguage: Language code (optional, default: 'eng')
- priority: Processing priority (optional: 'low', 'normal', 'high')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "filename": "document.pdf",
    "status": "uploaded",
    "message": "Document uploaded successfully"
  }
}
```

#### Get Document Details
```http
GET /api/documents/:documentId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "document.pdf",
    "status": "completed",
    "uploadDate": "2024-01-01T00:00:00Z",
    "fileSize": 1024000,
    "pageCount": 10,
    "processingTime": 5000
  }
}
```

#### List Documents
```http
GET /api/documents?page=1&limit=10&status=completed&search=keyword
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `status`: Filter by status (uploaded, processing, completed, failed)
- `search`: Search in filename and metadata
- `sortBy`: Sort field (uploadDate, filename, status)
- `sortOrder`: Sort order (asc, desc)

#### Get Document Text Chunks
```http
GET /api/documents/:documentId/chunks?page=1&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chunks": [
      {
        "id": "uuid",
        "text": "Extracted text content...",
        "pageNumber": 1,
        "chunkIndex": 0,
        "wordCount": 150
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

#### Download Original PDF
```http
GET /api/documents/:documentId/download
```

#### Delete Document
```http
DELETE /api/documents/:documentId
```

#### Reprocess Document
```http
POST /api/documents/:documentId/reprocess
```

### Processing Jobs

#### Get Job Status
```http
GET /api/jobs/:jobId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "text_extraction",
    "status": "active",
    "progress": 75,
    "startedAt": "2024-01-01T00:00:00Z",
    "estimatedCompletion": "2024-01-01T00:01:00Z"
  }
}
```

#### List Jobs
```http
GET /api/jobs?status=active&type=text_extraction&page=1&limit=20
```

#### Cancel Job
```http
POST /api/jobs/:jobId/cancel
```

### TTS (Text-to-Speech)

#### List Available Voices
```http
GET /api/tts/voices
```

#### Synthesize Text to Speech
```http
POST /api/tts/synthesize
Content-Type: application/json

{
  "text": "Text to convert to speech",
  "voice": "en-US-Standard-A",
  "speed": 1.0,
  "pitch": 0.0
}
```

#### Get Generated Audio
```http
GET /api/tts/audio/:audioId
```

### System

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "services": {
      "database": "connected",
      "redis": "connected",
      "storage": "available"
    },
    "system": {
      "memory": "45%",
      "cpu": "12%",
      "uptime": 3600
    }
  }
}
```

#### System Statistics
```http
GET /api/stats
```

## 🔧 Configuration

### OCR Settings
```env
TESSERACT_LANG=eng          # Language: eng, fra, deu, spa, etc.
OCR_DPI=300                 # Image DPI for OCR
MAX_PAGES_PER_BATCH=10      # Pages processed per batch
```

### Text Chunking
```env
MAX_WORDS_PER_CHUNK=1000    # Maximum words per chunk
OVERLAP_WORDS=50            # Overlap between chunks
```

### Processing Limits
```env
MAX_CONCURRENT_JOBS=5       # Concurrent processing jobs
JOB_TIMEOUT_MS=300000       # Job timeout (5 minutes)
```

### Security
```env
RATE_LIMIT_WINDOW_MS=900000 # Rate limit window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100 # Max requests per window
```

## 📁 Project Structure

```
src/
├── controllers/        # HTTP request handlers
│   ├── controller.documents.ts
│   ├── controller.jobs.ts
│   ├── controller.health.ts
│   └── controller.tts.ts
├── services/          # Business logic
│   ├── document.service.ts
│   ├── ocr.service.ts
│   ├── chunking.service.ts
│   └── storage.service.ts
├── models/            # Database models (Prisma)
│   ├── Document.ts
│   ├── ProcessingJob.ts
│   ├── QueueJob.ts
│   ├── TextChunk.ts
│   └── SystemLog.ts
├── middleware/        # Express middleware
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── error.middleware.ts
│   └── rateLimit.middleware.ts
├── utils/             # Utility functions
│   ├── logger.ts
│   ├── fileValidator.ts
│   └── textProcessor.ts
├── types/             # TypeScript interfaces
├── queues/            # Job queue processors
├── config/            # Configuration management
├── routes/            # API route definitions
├── storage/           # Storage providers (local/S3)
└── tests/             # Test files
```

## 🔄 Processing Flow

1. **Upload**: PDF uploaded via API endpoint with validation
2. **Validation**: File type, size, and structure validation
3. **Storage**: File stored (local/S3) and metadata saved to database
4. **Queue**: Processing job added to Redis queue with priority
5. **OCR**: Text extraction using Tesseract.js with configurable settings
6. **Chunking**: Text divided into TTS-ready chunks with overlap
7. **Completion**: Results saved to database and client notified
8. **Cleanup**: Temporary files removed and storage optimized

## 📊 Monitoring & Logging

### Logs
- **Console**: Real-time development logs with color coding
- **Files**: Rotating log files in production with automatic cleanup
- **Levels**: Error, Warn, Info, Debug with configurable verbosity
- **Structured**: JSON-formatted logs for easy parsing and analysis

### Health Checks
Monitor system health at `/api/health`:
- Database connectivity and performance
- Redis connectivity and queue status
- Storage availability and space
- Memory usage and CPU utilization
- Active job count and processing status

### Performance Metrics
- Request response times
- File processing throughput
- Memory usage patterns
- Queue processing rates
- Error rates and types

## 🔒 Security Features

- **File Validation**: MIME type and magic number checking
- **Size Limits**: Configurable file size restrictions
- **Rate Limiting**: Request throttling per IP with configurable windows
- **Input Sanitization**: Comprehensive validation for all inputs
- **Error Handling**: Secure error messages that don't leak sensitive information
- **CORS**: Configurable cross-origin policies
- **File Upload Security**: Virus scanning and malicious content detection
- **Authentication**: JWT-based authentication (planned)

## 🚀 Performance Optimization

### Memory Management
- **Streaming**: Large files processed in streams to minimize memory usage
- **Batching**: Pages processed in configurable batches for optimal performance
- **Cleanup**: Automatic temporary file cleanup and garbage collection
- **Pooling**: Database connection pooling and Redis connection management

### Scalability
- **Queue System**: Horizontal scaling with Redis-based job queues
- **Stateless Design**: No server-side sessions for easy scaling
- **Caching**: Redis-based caching for frequent operations
- **Load Balancing**: Compatible with load balancers and reverse proxies

### Processing Optimization
- **Parallel Processing**: Multiple jobs processed concurrently
- **Priority Queues**: High-priority jobs processed first
- **Resource Management**: Configurable resource limits and timeouts
- **Error Recovery**: Automatic retry mechanisms for failed jobs

## 🧪 Testing

### Test Types
- **Unit Tests**: Individual function and service testing
- **Integration Tests**: API endpoint and database integration testing
- **Performance Tests**: Large file processing and stress testing
- **Security Tests**: Input validation and security vulnerability testing

### Running Specific Tests
```bash
# Test specific service
npm test -- src/services/ocr.service.test.ts

# Test with specific pattern
npm test -- --testNamePattern="OCR"

# Test with coverage
npm run test:coverage

# Test specific file types
npm test -- --testNamePattern="PDF"
```

### Test Data
- Sample PDF files for testing
- Mock OCR responses
- Test database with sample data
- Performance benchmarking tools

## 🐛 Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
npm run clean
npm install
npm run build
```

#### Database connection issues
```bash
# Check PostgreSQL service
# Verify DATABASE_URL in .env
# Test connection: npm run db:migrate
# Run setup script: npm run setup-database
```

#### Redis connection issues
```bash
# Check Redis service
# Verify REDIS_HOST and REDIS_PORT in .env
# Test connection: redis-cli ping
```

#### OCR processing failures
```bash
# Check available memory
# Reduce MAX_PAGES_PER_BATCH
# Verify TESSERACT_LANG is installed
# Check temporary file permissions
```

#### File upload issues
```bash
# Verify upload directory permissions
# Check available disk space
# Validate file size limits
# Check MIME type validation
```

### Performance Issues
- Increase `MAX_CONCURRENT_JOBS` for faster processing
- Reduce `MAX_PAGES_PER_BATCH` if running out of memory
- Use SSD storage for better I/O performance
- Consider upgrading to larger Redis instance
- Monitor memory usage and adjust batch sizes

### Debug Mode
Enable debug logging for troubleshooting:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📈 Scaling in Production

### Horizontal Scaling
1. Deploy multiple application instances behind a load balancer
2. Use shared Redis instance for job queues and caching
3. Use shared PostgreSQL database with connection pooling
4. Use S3 for centralized file storage
5. Implement health checks and auto-scaling

### Vertical Scaling
1. Increase server memory for larger file processing
2. Use faster CPUs for OCR processing
3. Use SSD storage for temporary files
4. Optimize database queries and indexes
5. Implement efficient caching strategies

### Monitoring and Alerting
- Set up application performance monitoring (APM)
- Configure log aggregation and analysis
- Implement health check alerts
- Monitor resource usage and scaling metrics
- Set up error tracking and alerting

## 🐳 Docker Support

The project includes Docker configuration for easy deployment:

### Docker Compose
```bash
# Start all services
docker-compose up --build

# Start specific services
docker-compose up server redis postgres
```

### Dockerfile
```bash
# Build server image
docker build -t ocr-tts-server .

# Run server container
docker run -p 3001:3001 ocr-tts-server
```

### Environment Variables
Docker environment variables can be set in `docker-compose.yml` or passed directly to containers.

## 🔮 Roadmap

- [ ] Real-time WebSocket updates for processing status
- [ ] Multiple OCR engine support (Google Cloud Vision, Azure)
- [ ] Advanced text preprocessing and cleaning
- [ ] Machine learning text classification
- [ ] Microservices architecture with message queues
- [ ] Kubernetes deployment configurations
- [ ] GraphQL API support
- [ ] Advanced caching strategies with Redis
- [ ] Multi-tenant support
- [ ] Advanced TTS voice customization
- [ ] Batch document processing
- [ ] Document versioning and history
- [ ] Advanced search and indexing
- [ ] API rate limiting per user
- [ ] Webhook notifications
- [ ] Advanced analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request with detailed description

### Development Guidelines
- Follow TypeScript best practices
- Add comprehensive tests for new features
- Update documentation for API changes
- Follow the existing code style and patterns
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📖 Check the troubleshooting section above
- 🐛 Create an issue in the GitHub repository
- 📧 Contact the development team
- 💬 Join community discussions

## 🙏 Acknowledgments

- **Tesseract.js** - Advanced OCR engine for text extraction
- **Express.js** - Fast, unopinionated web framework
- **Prisma** - Next-generation database ORM
- **Bull** - Robust job queue for Node.js
- **Winston** - Comprehensive logging library
- **Node.js** - JavaScript runtime environment
- **PostgreSQL** - Advanced open-source database
- **Redis** - In-memory data structure store

---

**Happy Document Processing! 📄✨**
