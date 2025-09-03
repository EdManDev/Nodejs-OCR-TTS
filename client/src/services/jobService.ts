import { apiClient } from './api';
import { ProcessingJob, QueueJob, ApiResponse, PaginationState } from '@/types';

export class JobService {
  // Get all processing jobs
  async getJobs(
    filters?: {
      status?: string[];
      type?: string[];
      documentId?: string;
    },
    pagination?: Partial<PaginationState>
  ): Promise<ApiResponse<{ jobs: ProcessingJob[]; pagination: PaginationState }>> {
    const params = new URLSearchParams();
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (filters?.documentId) params.append('documentId', filters.documentId);
    if (filters?.status) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters?.type) {
      filters.type.forEach(type => params.append('type', type));
    }

    const queryString = params.toString();
    const url = `/jobs${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  }

  // Get a specific job by ID
  async getJob(id: string): Promise<ApiResponse<ProcessingJob>> {
    return apiClient.get(`/jobs/${id}`);
  }

  // Cancel a job
  async cancelJob(id: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/jobs/${id}/cancel`);
  }

  // Retry a failed job
  async retryJob(id: string): Promise<ApiResponse<ProcessingJob>> {
    return apiClient.post(`/jobs/${id}/retry`);
  }

  // Get job statistics
  async getJobStats(): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    averageProcessingTime: number;
    successRate: number;
    recentActivity: Array<{
      hour: string;
      completed: number;
      failed: number;
      pending: number;
    }>;
  }>> {
    return apiClient.get('/jobs/stats');
  }

  // Get queue information
  async getQueueInfo(): Promise<ApiResponse<{
    queues: Array<{
      name: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }>;
    workers: number;
    totalJobs: number;
    throughput: number;
  }>> {
    return apiClient.get('/jobs/queue');
  }

  // Get queue jobs
  async getQueueJobs(
    queueName?: string,
    status?: string,
    pagination?: Partial<PaginationState>
  ): Promise<ApiResponse<{ jobs: QueueJob[]; pagination: PaginationState }>> {
    const params = new URLSearchParams();
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (queueName) params.append('queue', queueName);
    if (status) params.append('status', status);

    const queryString = params.toString();
    const url = `/jobs/queue/jobs${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  }

  // Clear queue
  async clearQueue(queueName: string, status?: string): Promise<ApiResponse<{ cleared: number }>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const queryString = params.toString();
    const url = `/jobs/queue/${queueName}/clear${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.post(url);
  }

  // Pause/resume queue
  async pauseQueue(queueName: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/jobs/queue/${queueName}/pause`);
  }

  async resumeQueue(queueName: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/jobs/queue/${queueName}/resume`);
  }

  // Get job logs
  async getJobLogs(
    jobId: string,
    pagination?: Partial<PaginationState>
  ): Promise<ApiResponse<{
    logs: Array<{
      timestamp: string;
      level: string;
      message: string;
      metadata?: Record<string, any>;
    }>;
    pagination: PaginationState;
  }>> {
    const params = new URLSearchParams();
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());

    const queryString = params.toString();
    const url = `/jobs/${jobId}/logs${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  }
}

export const jobService = new JobService();