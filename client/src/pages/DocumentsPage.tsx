import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Upload, Search, Filter } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/FileUpload';
import { DocumentCard } from '@/components/DocumentCard';
import { DocumentStatus } from '@/types';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import { POLLING_INTERVALS } from '@/utils/constants';

export const DocumentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUpload, setShowUpload] = useState(searchParams.get('upload') === 'true');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    documents,
    loading,
    filters,
    pagination,
    fetchDocuments,
    loadMoreDocuments,
    deleteDocument,
    reprocessDocument,
    searchDocuments,
    handleStatusFilter,
  } = useDocumentStore();

  useEffect(() => {
    fetchDocuments();
  }, []); // Remove fetchDocuments from dependencies to prevent infinite loop

  // Memoize the processing documents check to prevent unnecessary re-renders
  const hasProcessingDocuments = useMemo(() =>
    documents.some(doc => doc.status === DocumentStatus.PROCESSING || doc.status === DocumentStatus.UPLOADED),
    [documents]
  );

  // Memoize the fetch function to prevent polling restarts
  const memoizedFetchDocuments = useCallback(() => {
    fetchDocuments();
  }, []);

  useSmartPolling({
    enabled: hasProcessingDocuments,
    interval: POLLING_INTERVALS.DOCUMENTS,
    maxInterval: POLLING_INTERVALS.MAX_INTERVAL,
    onPoll: memoizedFetchDocuments,
    dependencies: [hasProcessingDocuments]
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchDocuments(query);
    } else {
      fetchDocuments();
    }
  };


  const handleUploadComplete = () => {
    setShowUpload(false);
    setSearchParams({});
    fetchDocuments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500">Manage your uploaded documents and processing status</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-[50vw] mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Document</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                X
              </button>
            </div>
            <FileUpload onUploadComplete={handleUploadComplete} />
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {Object.values(DocumentStatus).map((status) => (
              <label key={status} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.status?.includes(status) || false}
                  onChange={() => handleStatusFilter(status)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600 capitalize">{status}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <LoadingState isLoading={loading.isLoading} error={loading.error}>
        {documents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onDelete={() => deleteDocument(document.id)}
                  onReprocess={() => reprocessDocument(document.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  onClick={loadMoreDocuments}
                  isLoading={loading.isLoading}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading your first document.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          </div>
        )}
      </LoadingState>
    </div>
  );
};