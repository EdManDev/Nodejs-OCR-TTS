import { apiClient } from './api';
import { SystemHealth, ApiResponse } from '@/types';

export class HealthService {
  // Get basic health status
  async getHealth(): Promise<ApiResponse<{ status: 'healthy' | 'degraded' | 'unhealthy' }>> {
    return apiClient.get('/health');
  }

  // Get detailed health information
  async getDetailedHealth(): Promise<ApiResponse<SystemHealth>> {
    return apiClient.get('/health/detailed');
  }

  // Get system metrics
  async getMetrics(): Promise<ApiResponse<{
    cpu: {
      usage: number;
      cores: number;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
    };
    uptime: number;
    timestamp: string;
  }>> {
    return apiClient.get('/health/metrics');
  }

  // Get application version and build info
  async getVersion(): Promise<ApiResponse<{
    version: string;
    buildDate: string;
    gitCommit: string;
    environment: string;
  }>> {
    return apiClient.get('/health/version');
  }
}

export const healthService = new HealthService();