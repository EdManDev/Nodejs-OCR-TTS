# Node.js OCR TTS Backend

A robust Node.js + TypeScript backend application for PDF Optical Character Recognition (OCR) and Text-to-Speech (TTS) preparation. Similar to Eleven Reader, this application efficiently processes large PDF files (up to 1000 pages), extracts text using OCR, and prepares it for TTS usage with intelligent chunking.

## 🚀 Features

- **Large PDF Processing**: Handle PDFs up to 1000 pages without crashing
- **Advanced OCR**: Extract text from both digital and scanned PDFs using Tesseract.js
- **Smart Text Chunking**: Prepare text for TTS with configurable chunking strategies
- **Asynchronous Processing**: Queue-based processing with Bull and Redis
- **Scalable Architecture**: Memory-efficient streaming and batching
- **Dual Storage Support**: Local filesystem and AWS S3 storage options
- **Comprehensive API**: RESTful endpoints for all operations
- **Security**: File validation, rate limiting, and secure uploads
- **Monitoring**: Advanced logging and health checks
- **Type Safety**: Full TypeScript implementation

## 📋 Prerequisites

- **Node.js**: Version 18.0 or higher
- **PostgreSQL**: Version 12 or higher
- **Redis**: Version 6.0 or higher
- **npm** or **yarn** package manager

### Optional Dependencies
- **AWS Account**: For S3 storage (if not using local storage)
- **Tesseract**: For improved OCR performance (automatically installed with tesseract.js)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd nodejs-ocr-tts
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
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ocr_tts_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key

# Storage (local or s3)
STORAGE_TYPE=local
MAX_FILE_SIZE=100MB
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate
```

### 5. Create Required Directories
```bash
mkdir uploads temp logs
```

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

#### Get Document Details
```http
GET /api/documents/:documentId
```

#### List Documents
```http
GET /api/documents?page=1&limit=10&status=completed
```

#### Get Document Text Chunks
```http
GET /api/documents/:documentId/chunks?page=1&limit=50
```

#### Download Original PDF
```http
GET /api/documents/:documentId/download
```

#### Delete Document
```http
DELETE /api/documents/:documentId
```

### Processing Jobs

#### Get Job Status
```http
GET /api/jobs/:jobId
```

#### List Jobs
```http
GET /api/jobs?status=active&type=text_extraction
```

#### Cancel Job
```http
POST /api/jobs/:jobId/cancel
```

### System

#### Health Check
```http
GET /api/health
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
├── services/          # Business logic
│   ├── document.service.ts
│   ├── ocr.service.ts
│   ├── chunking.service.ts
│   └── storage.service.ts
├── models/            # Database models (Prisma)
├── middleware/        # Express middleware
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── error.middleware.ts
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

1. **Upload**: PDF uploaded via API endpoint
2. **Validation**: File type, size, and structure validation
3. **Storage**: File stored (local/S3) and metadata saved
4. **Queue**: Processing job added to queue
5. **OCR**: Text extraction using Tesseract.js
6. **Chunking**: Text divided into TTS-ready chunks
7. **Completion**: Results saved and client notified

## 📊 Monitoring & Logging

### Logs
- **Console**: Real-time development logs
- **Files**: Rotating log files in production
- **Levels**: Error, Warn, Info, Debug

### Health Checks
Monitor system health at `/api/health`:
- Database connectivity
- Redis connectivity
- Storage availability
- Memory usage
- Queue status

## 🔒 Security Features

- **File Validation**: MIME type and magic number checking
- **Size Limits**: Configurable file size restrictions
- **Rate Limiting**: Request throttling per IP
- **Input Sanitization**: Joi validation for all inputs
- **Error Handling**: Secure error messages
- **CORS**: Configurable cross-origin policies

## 🚀 Performance Optimization

### Memory Management
- **Streaming**: Large files processed in streams
- **Batching**: Pages processed in configurable batches
- **Cleanup**: Automatic temporary file cleanup
- **Pooling**: Database connection pooling

### Scalability
- **Queue System**: Horizontal scaling with Redis
- **Stateless Design**: No server-side sessions
- **Caching**: Redis-based caching for frequent operations
- **Load Balancing**: Compatible with load balancers

## 🧪 Testing

### Test Types
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Performance Tests**: Large file processing tests

### Running Specific Tests
```bash
# Test specific service
npm test -- src/services/ocr.service.test.ts

# Test with specific pattern
npm test -- --testNamePattern="OCR"
```

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
```

#### Redis connection issues
```bash
# Check Redis service
# Verify REDIS_HOST and REDIS_PORT in .env
```

#### OCR processing failures
```bash
# Check available memory
# Reduce MAX_PAGES_PER_BATCH
# Verify TESSERACT_LANG is installed
```

### Performance Issues
- Increase `MAX_CONCURRENT_JOBS` for faster processing
- Reduce `MAX_PAGES_PER_BATCH` if running out of memory
- Use SSD storage for better I/O performance
- Consider upgrading to larger Redis instance

## 📈 Scaling in Production

### Horizontal Scaling
1. Deploy multiple application instances
2. Use shared Redis instance for queues
3. Use shared PostgreSQL database
4. Use S3 for file storage
5. Implement load balancer

### Vertical Scaling
1. Increase server memory for larger files
2. Use faster CPUs for OCR processing
3. Use SSD storage for temporary files

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

## 🔮 Roadmap

- [ ] Real-time WebSocket updates
- [ ] Multiple OCR engine support
- [ ] Advanced text preprocessing
- [ ] Machine learning text classification
- [ ] Microservices architecture
- [ ] Kubernetes deployment configs
- [ ] GraphQL API support
- [ ] Advanced caching strategies
