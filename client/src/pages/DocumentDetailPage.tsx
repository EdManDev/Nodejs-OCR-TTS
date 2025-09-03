import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Download, RotateCcw, Volume2 } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { DocumentStatus } from '@/types';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentDocument, loading, fetchDocument } = useDocumentStore();

  useEffect(() => {
    if (id) {
      fetchDocument(id);
    }
  }, [id]); // Remove fetchDocument from dependencies to prevent infinite loop

  if (!id) {
    return <div>Document ID not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/documents" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Details</h1>
          <p className="text-gray-500">View and manage document processing</p>
        </div>
      </div>

      <LoadingState isLoading={loading.isLoading} error={loading.error}>
        {currentDocument ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{currentDocument.originalName}</p>
                      <p className="text-sm text-gray-500">
                        {(currentDocument.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${currentDocument.status === DocumentStatus.COMPLETED
                          ? 'bg-green-100 text-green-800'
                          : currentDocument.status === DocumentStatus.PROCESSING
                            ? 'bg-yellow-100 text-yellow-800'
                            : currentDocument.status === DocumentStatus.FAILED
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                        {currentDocument.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Uploaded</p>
                      <p className="text-sm font-medium">
                        {new Date(currentDocument.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing Results */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Processing Results</h2>
                <p className="text-gray-500">OCR and TTS results will appear here when processing is complete.</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="space-y-3">
                  {currentDocument.downloadUrl && (
                    <Button className="w-full" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download Original
                    </Button>
                  )}
                  <Button className="w-full" size="sm" variant="secondary">
                    <Volume2 className="mr-2 h-4 w-4" />
                    Generate TTS
                  </Button>
                  <Button className="w-full" size="sm" variant="secondary">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reprocess
                  </Button>
                </div>
              </div>

              {/* Metadata */}
              {currentDocument.metadata && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
                  <div className="space-y-2">
                    {currentDocument.metadata.pageCount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Pages</span>
                        <span className="text-sm font-medium">{currentDocument.metadata.pageCount}</span>
                      </div>
                    )}
                    {currentDocument.metadata.wordCount && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Words</span>
                        <span className="text-sm font-medium">{currentDocument.metadata.wordCount}</span>
                      </div>
                    )}
                    {currentDocument.metadata.ocrConfidence && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">OCR Confidence</span>
                        <span className="text-sm font-medium">{Math.round(currentDocument.metadata.ocrConfidence)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Document not found</p>
          </div>
        )}
      </LoadingState>
    </div>
  );
};