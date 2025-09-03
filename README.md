# Node.js OCR TTS Monorepo

A comprehensive Node.js TypeScript monorepo for PDF OCR (Optical Character Recognition) and TTS (Text-to-Speech) processing. This project provides a robust backend API server and a React-based frontend client for handling document processing workflows.

## 🚀 Features

### Backend (Server)
- **PDF Processing**: Upload and process PDF documents
- **OCR Engine**: Extract text from scanned PDFs using Tesseract.js
- **Text Chunking**: Intelligent text segmentation for processing
- **TTS Integration**: Convert text to speech
- **Job Queue**: Background processing with Bull/Redis
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Local filesystem or AWS S3 support
- **API**: RESTful API with comprehensive endpoints
- **Security**: Rate limiting, CORS, helmet protection
- **Logging**: Structured logging with Winston

### Frontend (Client)
- **React**: Modern React application with TypeScript
- **UI Components**: Reusable components for file upload, document management
- **State Management**: Zustand for state management
- **Routing**: React Router for navigation
- **Styling**: Tailwind CSS for responsive design
- **API Integration**: Axios for backend communication

## 📋 Prerequisites

- Node.js (>= 18.0.0)
- npm or yarn
- PostgreSQL database
- Redis server (for job queue)
- Tesseract OCR (for text extraction)

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
│   └── package.json
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── main.tsx        # Client entry point
│   └── package.json
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
- `GET /api/health` - Server health check

### Documents (Coming Soon)
- `GET /api/documents` - List all documents
- `POST /api/documents/upload` - Upload new document
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/chunks` - Get document text chunks

### Jobs (Coming Soon)
- `GET /api/jobs` - List processing jobs
- `GET /api/jobs/:id` - Get job details

### TTS (Coming Soon)
- `GET /api/tts/voices` - List available voices
- `POST /api/tts/synthesize` - Convert text to speech
- `GET /api/tts/audio/:id` - Get audio file

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express applications
- **Input Validation**: Request validation and sanitization
- **File Upload Security**: MIME type validation and size limits
- **Environment Variables**: Secure configuration management

## 📊 Monitoring & Logging

- **Structured Logging**: JSON-formatted logs with Winston
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error handling and logging
- **Performance Monitoring**: Request timing and metrics
- **Health Checks**: Application health monitoring

## 🔧 Configuration

### Server Configuration
The server can be configured via environment variables or the config file at `server/src/config/index.ts`.

### Storage Options
- **Local Storage**: Files stored in local filesystem
- **AWS S3**: Files stored in Amazon S3 bucket

### Database Options
- **PostgreSQL**: Primary database (required)
- **Redis**: Job queue and caching (required)

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
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis configuration in server/.env
   # Ensure Redis server is running
   ```

4. **Build Issues**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

### Development Tips

- Use `npm run db:studio` to inspect database contents
- Check server logs for detailed error information
- Use browser dev tools to debug client-side issues
- Ensure all environment variables are properly set

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Tesseract.js** - OCR engine
- **Express.js** - Web framework
- **React** - Frontend framework
- **Prisma** - Database ORM
- **Bull** - Job queue
- **Winston** - Logging library

---

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.