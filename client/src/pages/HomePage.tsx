import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Briefcase, Activity } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { useJobStore } from '@/store/useJobStore';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { DocumentStatus } from '@/types';

export const HomePage: React.FC = () => {
  const { documents, loading: docLoading, fetchDocuments } = useDocumentStore();
  const { jobs, loading: jobLoading, fetchJobs, stats, fetchStats } = useJobStore();

  useEffect(() => {
    fetchDocuments();
    fetchJobs();
    fetchStats();
  }, []); // Remove function dependencies to prevent infinite loop

  const recentDocuments = documents.slice(0, 5);
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome to your OCR TTS platform</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Processing Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.byStatus?.processing || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.successRate ? `${Math.round(stats.successRate)}%` : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.averageProcessingTime ? `${Math.round(stats.averageProcessingTime)}s` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
              <Link to="/documents" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <LoadingState isLoading={docLoading.isLoading} error={docLoading.error}>
              {recentDocuments.length > 0 ? (
                <div className="space-y-3">
                  {recentDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate"
                        >
                          {doc.originalName}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${doc.status === DocumentStatus.COMPLETED
                        ? 'bg-green-100 text-green-800'
                        : doc.status === DocumentStatus.PROCESSING
                          ? 'bg-yellow-100 text-yellow-800'
                          : doc.status === DocumentStatus.FAILED
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No documents yet</p>
              )}
            </LoadingState>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              <Link to="/jobs" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            <LoadingState isLoading={jobLoading.isLoading} error={jobLoading.error}>
              {recentJobs.length > 0 ? (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <div key={job.id} className="flex items-center space-x-3">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-primary-600"
                        >
                          {job.type.toUpperCase()} Job
                        </Link>
                        <p className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{job.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No jobs yet</p>
              )}
            </LoadingState>
          </div>
        </div>
      </div>
    </div>
  );
};