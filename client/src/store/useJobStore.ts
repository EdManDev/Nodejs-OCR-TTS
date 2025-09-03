import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ProcessingJob, QueueJob, JobStatus, JobType, LoadingState, PaginationState } from '@/types';
import { jobService } from '@/services/jobService';

interface JobStore {
  // State
  jobs: ProcessingJob[];
  queueJobs: QueueJob[];
  currentJob: ProcessingJob | null;
  loading: LoadingState;
  pagination: PaginationState;
  filters: {
    status: JobStatus[];
    type: JobType[];
    documentId?: string;
  };
  queueInfo: {
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
  } | null;
  stats: {
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
  } | null;

  // Actions
  setJobs: (jobs: ProcessingJob[]) => void;
  setQueueJobs: (jobs: QueueJob[]) => void;
  setCurrentJob: (job: ProcessingJob | null) => void;
  setLoading: (loading: Partial<LoadingState>) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setFilters: (filters: Partial<JobStore['filters']>) => void;
  setQueueInfo: (info: JobStore['queueInfo']) => void;
  setStats: (stats: JobStore['stats']) => void;

  // Async actions
  fetchJobs: () => Promise<void>;
  fetchJob: (id: string) => Promise<void>;
  fetchQueueJobs: (queueName?: string, status?: string) => Promise<void>;
  fetchQueueInfo: () => Promise<void>;
  fetchStats: () => Promise<void>;
  cancelJob: (id: string) => Promise<void>;
  retryJob: (id: string) => Promise<void>;
  clearQueue: (queueName: string, status?: string) => Promise<void>;
  pauseQueue: (queueName: string) => Promise<void>;
  resumeQueue: (queueName: string) => Promise<void>;

  // Utilities
  getJobById: (id: string) => ProcessingJob | undefined;
  updateJob: (id: string, updates: Partial<ProcessingJob>) => void;
  removeJob: (id: string) => void;
  getJobsByDocument: (documentId: string) => ProcessingJob[];
  getActiveJobs: () => ProcessingJob[];
  getFailedJobs: () => ProcessingJob[];
  resetFilters: () => void;
}

const initialPagination: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
};

const initialFilters: JobStore['filters'] = {
  status: [],
  type: [],
  documentId: undefined,
};

const initialLoading: LoadingState = {
  isLoading: false,
  error: undefined,
  message: undefined,
};

export const useJobStore = create<JobStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    jobs: [],
    queueJobs: [],
    currentJob: null,
    loading: initialLoading,
    pagination: initialPagination,
    filters: initialFilters,
    queueInfo: null,
    stats: null,

    // State setters
    setJobs: (jobs) => set({ jobs }),
    setQueueJobs: (queueJobs) => set({ queueJobs }),
    setCurrentJob: (job) => set({ currentJob: job }),
    setLoading: (loading) => set((state) => ({ loading: { ...state.loading, ...loading } })),
    setPagination: (pagination) => set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    setQueueInfo: (queueInfo) => set({ queueInfo }),
    setStats: (stats) => set({ stats }),

    // Async actions
    fetchJobs: async () => {
      const { filters, pagination } = get();
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await jobService.getJobs(filters, pagination);

        if (response.success && response.data) {
          const { jobs, pagination: newPagination } = response.data;
          set({
            jobs,
            pagination: newPagination,
            loading: { isLoading: false },
          });
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to fetch jobs' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    fetchJob: async (id: string) => {
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await jobService.getJob(id);

        if (response.success && response.data) {
          set({
            currentJob: response.data,
            loading: { isLoading: false },
          });
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to fetch job' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    fetchQueueJobs: async (queueName?: string, status?: string) => {
      const { pagination } = get();
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await jobService.getQueueJobs(queueName, status, pagination);

        if (response.success && response.data) {
          const { jobs, pagination: newPagination } = response.data;
          set({
            queueJobs: jobs,
            pagination: newPagination,
            loading: { isLoading: false },
          });
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to fetch queue jobs' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    fetchQueueInfo: async () => {
      try {
        const response = await jobService.getQueueInfo();

        if (response.success && response.data) {
          set({ queueInfo: response.data });
        }
      } catch (error) {
        console.error('Failed to fetch queue info:', error);
      }
    },

    fetchStats: async () => {
      try {
        const response = await jobService.getJobStats();

        if (response.success && response.data) {
          set({ stats: response.data });
        }
      } catch (error) {
        console.error('Failed to fetch job stats:', error);
      }
    },

    cancelJob: async (id: string) => {
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await jobService.cancelJob(id);

        if (response.success) {
          set((state) => ({
            jobs: state.jobs.map(job =>
              job.id === id ? { ...job, status: JobStatus.CANCELLED } : job
            ),
            currentJob: state.currentJob?.id === id
              ? { ...state.currentJob, status: JobStatus.CANCELLED }
              : state.currentJob,
            loading: { isLoading: false, message: 'Job cancelled successfully' },
          }));
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to cancel job' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    retryJob: async (id: string) => {
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await jobService.retryJob(id);

        if (response.success && response.data) {
          const updatedJob = response.data;
          set((state) => ({
            jobs: state.jobs.map(job =>
              job.id === id ? updatedJob : job
            ),
            currentJob: state.currentJob?.id === id ? updatedJob : state.currentJob,
            loading: { isLoading: false, message: 'Job retry initiated' },
          }));
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to retry job' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    clearQueue: async (queueName: string, status?: string) => {
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await jobService.clearQueue(queueName, status);

        if (response.success) {
          set({ loading: { isLoading: false, message: `Queue cleared: ${response.data?.cleared || 0} jobs` } });
          // Refresh queue info and jobs
          get().fetchQueueInfo();
          get().fetchQueueJobs();
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to clear queue' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    pauseQueue: async (queueName: string) => {
      try {
        const response = await jobService.pauseQueue(queueName);

        if (response.success) {
          get().fetchQueueInfo();
        }
      } catch (error) {
        console.error('Failed to pause queue:', error);
      }
    },

    resumeQueue: async (queueName: string) => {
      try {
        const response = await jobService.resumeQueue(queueName);

        if (response.success) {
          get().fetchQueueInfo();
        }
      } catch (error) {
        console.error('Failed to resume queue:', error);
      }
    },

    // Utilities
    getJobById: (id: string) => {
      return get().jobs.find(job => job.id === id);
    },

    updateJob: (id: string, updates: Partial<ProcessingJob>) => {
      set((state) => ({
        jobs: state.jobs.map(job =>
          job.id === id ? { ...job, ...updates } : job
        ),
        currentJob: state.currentJob?.id === id
          ? { ...state.currentJob, ...updates }
          : state.currentJob,
      }));
    },

    removeJob: (id: string) => {
      set((state) => ({
        jobs: state.jobs.filter(job => job.id !== id),
        currentJob: state.currentJob?.id === id ? null : state.currentJob,
      }));
    },

    getJobsByDocument: (documentId: string) => {
      return get().jobs.filter(job => job.documentId === documentId);
    },

    getActiveJobs: () => {
      return get().jobs.filter(job => job.status === JobStatus.PROCESSING);
    },

    getFailedJobs: () => {
      return get().jobs.filter(job => job.status === JobStatus.FAILED);
    },

    resetFilters: () => {
      set({ filters: initialFilters, pagination: initialPagination });
    },
  }))
);

// Removed automatic subscriptions to prevent excessive API calls
// Refetches should be triggered manually by user actions or polling