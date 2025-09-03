import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { uploadDocument, uploadProgress, loading } = useDocumentStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Clean up previous preview URL to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(file);

      // Create preview for PDF
      if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadDocument(selectedFile);
      if (result) {
        setSelectedFile(null);
        setPreviewUrl(null);
        onUploadComplete?.();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {isDragActive ? 'Drop the PDF here' : 'Upload a PDF document'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Drag and drop a PDF file here, or click to select
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Maximum file size: 10MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Preview */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* PDF Preview */}
            {previewUrl && (
              <div className="mt-4">
                <iframe
                  src={previewUrl}
                  className="w-full h-64 border border-gray-200 rounded"
                  title="PDF Preview"
                />
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {loading.isLoading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-600">Uploading...</span>
                <span className="text-sm font-medium text-gray-900">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {loading.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {loading.error}
            </div>
          )}

          {/* Success Message */}
          {loading.message && !loading.error && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
              {loading.message}
            </div>
          )}

          {/* Upload Button */}
          <div className="flex space-x-3">
            <Button
              onClick={handleUpload}
              isLoading={loading.isLoading}
              className="flex-1"
            >
              Upload Document
            </Button>
            <Button
              variant="secondary"
              onClick={handleRemoveFile}
              disabled={loading.isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};