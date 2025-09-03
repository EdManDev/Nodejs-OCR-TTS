import { Router, Request, Response } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/controller.documents';
import config from '../config';
import { APIResponse } from '../types';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: config.upload.tempPath,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    // Allow PDF and text files for testing
    const allowedTypes = [...config.upload.allowedMimeTypes, 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and text files are allowed.'));
    }
  },
});

// Simple test route
router.get('/test', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Document routes working',
    data: { timestamp: new Date().toISOString() }
  } as APIResponse);
});

// Document management routes
router.get('/stats', documentController.getDocumentStats.bind(documentController));
router.get('/search', documentController.searchDocuments.bind(documentController));
router.get('/', documentController.getDocuments.bind(documentController));
router.get('/:id', documentController.getDocumentById.bind(documentController));
router.get('/:id/chunks', documentController.getDocumentChunks.bind(documentController));
router.get('/:id/download', documentController.downloadDocument.bind(documentController));
router.get('/:id/file', documentController.serveDocument.bind(documentController));
router.post('/upload', upload.single('file'), documentController.uploadDocument.bind(documentController));
router.post('/:id/reprocess', documentController.reprocessDocument.bind(documentController));
router.delete('/:id', documentController.deleteDocument.bind(documentController));

export default router;