import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const requestKey = `GET:${url}:${JSON.stringify(config)}`;

    // Check if request is already pending
    if (this.pendingRequests.has(requestKey)) {
      console.log(`Deduplicating request: ${requestKey}`);
      return this.pendingRequests.get(requestKey)!;
    }

    const requestPromise = this.makeRequest<T>(() => this.client.get(url, config));
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  private async makeRequest<T>(requestFn: () => Promise<any>): Promise<ApiResponse<T>> {
    try {
      const response = await requestFn();
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Clear all pending requests (useful for cleanup)
  clearPendingRequests(): void {
    this.pendingRequests.clear();
  }

  // Get count of pending requests (useful for debugging)
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error - don't retry immediately to prevent spam
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error('An unexpected error occurred');
    }
  }

  // Add retry logic for critical requests (currently unused but available for future use)
  // private async withRetry<T>(
  //   requestFn: () => Promise<T>,
  //   maxRetries: number = 2,
  //   delay: number = 1000
  // ): Promise<T> {
  //   let lastError: Error;
  //   
  //   for (let attempt = 0; attempt <= maxRetries; attempt++) {
  //     try {
  //       return await requestFn();
  //     } catch (error: any) {
  //       lastError = error as Error;
  //       
  //       // Don't retry on client errors (4xx) or server errors (5xx) except 5xx
  //       if (error.response?.status >= 400 && error.response?.status < 500) {
  //         throw error;
  //       }
  //       
  //       if (attempt < maxRetries) {
  //         await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
  //       }
  //     }
  //   }
  //   
  //   throw lastError!;
  // }
}

export const apiClient = new ApiClient();