import React, { useEffect } from 'react';
import { Shield, Activity, BarChart3, Settings } from 'lucide-react';
import { useJobStore } from '@/store/useJobStore';
import { LoadingState } from '@/components/ui/LoadingSpinner';

export const AdminPage: React.FC = () => {
  const { queueInfo, stats, fetchQueueInfo, fetchStats } = useJobStore();

  useEffect(() => {
    fetchQueueInfo();
    fetchStats();
  }, []); // Remove function dependencies to prevent infinite loop

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Monitor system health and manage queues</p>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System Status</p>
              <p className="text-2xl font-bold text-green-600">Healthy</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Workers</p>
              <p className="text-2xl font-bold text-gray-900">{queueInfo?.workers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Queue Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{queueInfo?.totalJobs || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.successRate ? `${Math.round(stats.successRate)}%` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Queue Status</h2>
        </div>
        <div className="p-6">
          <LoadingState isLoading={false} error={undefined}>
            {queueInfo?.queues && queueInfo.queues.length > 0 ? (
              <div className="space-y-4">
                {queueInfo.queues.map((queue) => (
                  <div key={queue.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{queue.name}</h3>
                      <span className="text-sm text-gray-500">
                        Total: {queue.waiting + queue.active + queue.completed + queue.failed}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Waiting</p>
                        <p className="font-medium text-blue-600">{queue.waiting}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Active</p>
                        <p className="font-medium text-yellow-600">{queue.active}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Completed</p>
                        <p className="font-medium text-green-600">{queue.completed}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Failed</p>
                        <p className="font-medium text-red-600">{queue.failed}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Delayed</p>
                        <p className="font-medium text-gray-600">{queue.delayed}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No queue information available</p>
            )}
          </LoadingState>
        </div>
      </div>
    </div>
  );
};