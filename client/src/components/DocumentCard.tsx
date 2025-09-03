import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Trash2, RotateCcw, Eye, Clock } from 'lucide-react';
import { Document } from '@/types';
import { Button } from '@/components/ui/Button';

interface DocumentCardProps {
  document: Document;
  onDelete: () => void;
  onReprocess: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDelete,
  onReprocess,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-red-500" />
            <div className="flex-1 min-w-0">
              <Link
                to={`/documents/${document.id}`}
                className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block"
              >
                {document.originalName}
              </Link>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(document.size)}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(document.status)}`}>
            {document.status}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            Uploaded {new Date(document.uploadedAt).toLocaleDateString()}
          </div>
          
          {document.metadata && (
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {document.metadata.pageCount && (
                <span>{document.metadata.pageCount} pages</span>
              )}
              {document.metadata.wordCount && (
                <span>{document.metadata.wordCount} words</span>
              )}
              {document.metadata.ocrConfidence && (
                <span>{Math.round(document.metadata.ocrConfidence)}% confidence</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <Link to={`/documents/${document.id}`}>
            <Button size="sm" variant="ghost">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </Link>
          
          {document.downloadUrl && (
            <a href={document.downloadUrl} download>
              <Button size="sm" variant="ghost">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </a>
          )}
          
          {document.status === 'failed' && (
            <Button size="sm" variant="ghost" onClick={onReprocess}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
          
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};