import React, { useEffect, useMemo, useCallback } from 'react';
import { Briefcase, X, RotateCcw } from 'lucide-react';
import { useJobStore } from '@/store/useJobStore';
import { LoadingState } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useSmartPolling } from '@/hooks/useSmartPolling';
import { POLLING_INTERVALS } from '@/utils/constants';

export const JobsPage: React.FC = () => {
  const { jobs, loading, fetchJobs, cancelJob, retryJob } = useJobStore();

  useEffect(() => {
    fetchJobs();
  }, []); // Remove fetchJobs from dependencies to prevent infinite loop

  // Memoize the active jobs check to prevent unnecessary re-renders
  const hasActiveJobs = useMemo(() =>
    jobs.some(job => job.status === 'processing' || job.status === 'waiting'),
    [jobs]
  );

  // Memoize the fetch function to prevent polling restarts
  const memoizedFetchJobs = useCallback(() => {
    fetchJobs();
  }, []);

  useSmartPolling({
    enabled: hasActiveJobs,
    interval: POLLING_INTERVALS.JOBS,
    maxInterval: POLLING_INTERVALS.MAX_INTERVAL,
    onPoll: memoizedFetchJobs,
    dependencies: [hasActiveJobs]
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500">Monitor and manage processing jobs</p>
        </div>
      </div>

      {/* Jobs List */}
      <LoadingState isLoading={loading.isLoading} error={loading.error}>
        {jobs.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {job.id.substring(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            Doc: {job.documentId.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {job.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{job.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {job.status === 'processing' && (
                          <Button size="sm" variant="ghost" onClick={() => cancelJob(job.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {job.status === 'failed' && (
                          <Button size="sm" variant="ghost" onClick={() => retryJob(job.id)}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Processing jobs will appear here when documents are uploaded.
            </p>
          </div>
        )}
      </LoadingState>
    </div>
  );
};