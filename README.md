# Node.js OCR TTS Monorepo

A comprehensive Node.js TypeScript monorepo for PDF OCR (Optical Character Recognition) and TTS (Text-to-Speech) processing. This project provides a robust backend API server and a modern React-based frontend client for handling document processing workflows with intelligent text chunking and audio synthesis capabilities.

## 🚀 Features

### Backend (Server)
- **PDF Processing**: Upload and process PDF documents up to 1000+ pages
- **Advanced OCR Engine**: Extract text from scanned PDFs using Tesseract.js with configurable languages
- **Intelligent Text Chunking**: Smart text segmentation optimized for TTS processing
- **TTS Integration**: Convert extracted text to speech with multiple voice options
- **Job Queue System**: Background processing with Bull/Redis for scalability
- **Database**: PostgreSQL with Prisma ORM for robust data management
- **Dual Storage**: Local filesystem or AWS S3 storage support
- **RESTful API**: Comprehensive endpoints with proper error handling
- **Security**: Rate limiting, CORS, helmet protection, input validation
- **Advanced Logging**: Structured logging with Winston and file rotation
- **Health Monitoring**: Real-time system health checks and metrics

### Frontend (Client)
- **Modern React**: Built with React 18, TypeScript, and Vite
- **Responsive UI**: Beautiful, mobile-friendly interface with Tailwind CSS
- **Smart Components**: Reusable components for file upload, document management, and job tracking
- **State Management**: Zustand for efficient state management
- **Client-Side Routing**: React Router for seamless navigation
- **Real-time Updates**: Smart polling for processing status updates
- **Error Handling**: Comprehensive error boundaries and user feedback
- **File Upload**: Drag-and-drop file upload with progress tracking

## 📋 Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm** or **yarn** package manager
- **PostgreSQL**: Version 12 or higher
- **Redis**: Version 6.0 or higher (for job queue)
- **Tesseract OCR**: Automatically installed with tesseract.js

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd nodejs-ocr-tts
```

### 2. Install dependencies
```bash
# Install all dependencies (root, server, and client)
npm run install:all

# Or install individually
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Environment Setup

#### Server Environment
Create a `.env` file in the `server` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ocr_tts_db"

# Redis Configuration (for Bull Queue)
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

#### Client Environment
Create a `.env` file in the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=OCR TTS Processing
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

## 🚀 Running the Application

### Development Mode
```bash
# Start both server and client concurrently
npm run dev

# Or start individually
npm run dev:server  # Server only
npm run dev:client  # Client only
```

### Production Mode
```bash
# Build both applications
npm run build

# Start production server
npm run start
```

## 📁 Project Structure

```
nodejs-ocr-tts/
├── server/                 # Backend API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── storage/        # File storage providers
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Server entry point
│   ├── prisma/             # Database schema and migrations
│   ├── uploads/            # File uploads (if using local storage)
│   ├── temp/               # Temporary processing files
│   ├── logs/               # Application logs
│   └── package.json
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # Reusable UI components
│   │   │   ├── layout/     # Layout components
│   │   │   └── ...         # Feature components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management (Zustand)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── main.tsx        # Client entry point
│   ├── public/             # Static assets
│   ├── dist/               # Build output
│   └── package.json
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Server Dockerfile
└── package.json            # Root package.json
```

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Start both server and client in development mode
- `npm run build` - Build both applications
- `npm run start` - Start production server
- `npm run install:all` - Install all dependencies
- `npm run clean` - Clean build artifacts
- `npm run test` - Run tests
- `npm run lint` - Run linting

### Server Scripts
- `npm run dev` - Start server in development mode
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run server tests
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

### Client Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 API Endpoints

### Health Check
- `GET /api/health` - Server health check with detailed system status

### Documents
- `GET /api/documents` - List all documents with pagination and filtering
- `POST /api/documents/upload` - Upload new PDF document
- `GET /api/documents/:id` - Get document details and processing status
- `GET /api/documents/:id/chunks` - Get document text chunks for TTS
- `GET /api/documents/:id/download` - Download original PDF file
- `DELETE /api/documents/:id` - Delete document and associated files
- `POST /api/documents/:id/reprocess` - Reprocess document

### Jobs
- `GET /api/jobs` - List processing jobs with status filtering
- `GET /api/jobs/:id` - Get detailed job information
- `POST /api/jobs/:id/cancel` - Cancel active processing job

### TTS (Text-to-Speech)
- `GET /api/tts/voices` - List available TTS voices
- `POST /api/tts/synthesize` - Convert text chunks to speech
- `GET /api/tts/audio/:id` - Get generated audio file

## 🔒 Security Features

- **Rate Limiting**: Configurable request throttling per IP address
- **CORS Protection**: Configurable cross-origin resource sharing policies
- **Helmet**: Security headers for Express applications
- **Input Validation**: Comprehensive request validation and sanitization
- **File Upload Security**: MIME type validation, size limits, and virus scanning
- **Environment Variables**: Secure configuration management
- **Error Handling**: Secure error messages that don't leak sensitive information

## 📊 Monitoring & Logging

- **Structured Logging**: JSON-formatted logs with Winston for easy parsing
- **Request Logging**: HTTP request/response logging with timing information
- **Error Tracking**: Comprehensive error handling and logging with stack traces
- **Performance Monitoring**: Request timing, memory usage, and queue metrics
- **Health Checks**: Real-time application health monitoring with detailed status
- **File Rotation**: Automatic log file rotation and cleanup

## 🔧 Configuration

### Server Configuration
The server can be configured via environment variables or the config file at `server/src/config/index.ts`.

### Storage Options
- **Local Storage**: Files stored in local filesystem with configurable paths
- **AWS S3**: Files stored in Amazon S3 bucket with configurable regions

### Database Options
- **PostgreSQL**: Primary database with Prisma ORM (required)
- **Redis**: Job queue, caching, and session storage (required)

### OCR Configuration
- **Language Support**: Multiple language support (English, French, German, Spanish, etc.)
- **DPI Settings**: Configurable image resolution for optimal OCR accuracy
- **Batch Processing**: Configurable page batch sizes for memory optimization

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change PORT in server/.env file
   PORT=3001
   ```

2. **Database Connection Issues**
   ```bash
   # Check DATABASE_URL in server/.env
   # Ensure PostgreSQL is running
   # Run: npm run setup-database
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis configuration in server/.env
   # Ensure Redis server is running
   # Test connection: redis-cli ping
   ```

4. **Build Issues**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

5. **OCR Processing Failures**
   ```bash
   # Check available memory
   # Reduce MAX_PAGES_PER_BATCH in .env
   # Verify TESSERACT_LANG is correct
   ```

### Development Tips

- Use `npm run db:studio` to inspect database contents visually
- Check server logs in `server/logs/` for detailed error information
- Use browser dev tools to debug client-side issues
- Ensure all environment variables are properly set
- Monitor Redis queue status for job processing issues

## 🐳 Docker Support

The project includes Docker configuration for easy deployment:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run server only
docker build -t ocr-tts-server ./server
docker run -p 3001:3001 ocr-tts-server
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm test -- --testNamePattern="OCR"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Add tests if applicable
5. Ensure all tests pass
6. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tesseract.js** - Advanced OCR engine for text extraction
- **Express.js** - Fast, unopinionated web framework
- **React** - Modern frontend framework with TypeScript
- **Prisma** - Next-generation database ORM
- **Bull** - Robust job queue for Node.js
- **Winston** - Comprehensive logging library
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Next-generation frontend tooling

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

---

## 📞 Support

For issues and questions:
- 📖 Check the troubleshooting section above
- 🐛 Open an issue in the GitHub repository
- 💬 Join our community discussions
- 📧 Contact the development team

**Happy Document Processing! 📄✨**