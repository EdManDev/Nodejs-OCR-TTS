# OCR TTS Client

This is the frontend client for the Node.js OCR TTS application.

## Screenshots

|                                                        |                                                        |
| :---------------------------------------------------: | :---------------------------------------------------: |
| <img width="400" alt="" src="./screenshots/01.png">  | <img width="400" alt="" src="./screenshots/02.png">  |
| <img width="400" alt="" src="./screenshots/03.png">  | <img width="400" alt="" src="./screenshots/04.png">  |

## Getting Started


The client directory is set up as a workspace in the monorepo. You can add your preferred frontend framework here (React, Vue, Angular, etc.).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linter
- `npm run clean` - Clean build artifacts

## API Integration

The client should connect to the backend server running on `http://localhost:3000` (or the configured port).

### Available API Endpoints

- `GET /api/health` - Health check
- `POST /api/documents/upload` - Upload PDF document
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `POST /api/tts/synthesize` - Convert text to speech
- `GET /api/jobs` - List processing jobs

## Next Steps

1. Choose your frontend framework
2. Install dependencies
3. Set up API client
4. Create UI components for document upload and management
5. Implement TTS functionality