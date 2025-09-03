import { apiClient } from './api';
import { Document, ApiResponse, TextChunk, FilterOptions, PaginationState } from '@/types';

export class DocumentService {
  // Upload a document
  async uploadDocument(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<Document>> {
    return apiClient.uploadFile<Document>('/documents/upload', file, onProgress);
  }

  // Get all documents with optional filtering and pagination
  async getDocuments(
    filters?: FilterOptions,
    pagination?: Partial<PaginationState>
  ): Promise<ApiResponse<{ documents: Document[]; pagination: PaginationState }>> {
    const params = new URLSearchParams();
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) {
      filters.status.forEach(status => params.append('status', status));
    }
    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start);
      params.append('endDate', filters.dateRange.end);
    }

    const queryString = params.toString();
    const url = `/documents${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  }

  // Get a specific document by ID
  async getDocument(id: string): Promise<ApiResponse<Document>> {
    return apiClient.get(`/documents/${id}`);
  }

  // Get document download URL
  async getDocumentDownloadUrl(id: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.get(`/documents/${id}/download`);
  }

  // Delete a document
  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/documents/${id}`);
  }

  // Reprocess a document
  async reprocessDocument(id: string): Promise<ApiResponse<Document>> {
    return apiClient.post(`/documents/${id}/reprocess`);
  }

  // Get text chunks for a document
  async getDocumentChunks(
    documentId: string,
    pagination?: Partial<PaginationState>
  ): Promise<ApiResponse<{ chunks: TextChunk[]; pagination: PaginationState }>> {
    const params = new URLSearchParams();
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());

    const queryString = params.toString();
    const url = `/documents/${documentId}/chunks${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  }

  // Get document statistics
  async getDocumentStats(): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    processingTimeAverage: number;
    successRate: number;
    recentActivity: Array<{
      date: string;
      uploads: number;
      processed: number;
      failed: number;
    }>;
  }>> {
    return apiClient.get('/documents/stats');
  }

  // Search documents
  async searchDocuments(
    query: string,
    options?: {
      includeContent?: boolean;
      limit?: number;
    }
  ): Promise<ApiResponse<{
    documents: Document[];
    totalResults: number;
    searchTime: number;
  }>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (options?.includeContent) params.append('includeContent', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());

    return apiClient.get(`/documents/search?${params.toString()}`);
  }
}

export const documentService = new DocumentService();