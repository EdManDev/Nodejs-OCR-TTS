import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Document, DocumentStatus, FilterOptions, PaginationState, LoadingState } from '@/types';
import { documentService } from '@/services/documentService';

interface DocumentStore {
  // State
  documents: Document[];
  currentDocument: Document | null;
  loading: LoadingState;
  filters: FilterOptions;
  pagination: PaginationState;
  uploadProgress: number;

  // Actions
  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (document: Document | null) => void;
  setLoading: (loading: Partial<LoadingState>) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setPagination: (pagination: Partial<PaginationState>) => void;
  setUploadProgress: (progress: number) => void;

  // Async actions
  fetchDocuments: () => Promise<void>;
  loadMoreDocuments: () => Promise<void>;
  fetchDocument: (id: string) => Promise<void>;
  uploadDocument: (file: File) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<void>;
  reprocessDocument: (id: string) => Promise<void>;
  searchDocuments: (query: string) => Promise<void>;

  // Utilities
  getDocumentById: (id: string) => Document | undefined;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  clearDocuments: () => void;
  resetFilters: () => void;
  handleStatusFilter: (status: DocumentStatus) => void;
}

const initialPagination: PaginationState = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false,
};

const initialFilters: FilterOptions = {
  status: [],
  search: '',
  dateRange: undefined,
};

const initialLoading: LoadingState = {
  isLoading: false,
  error: undefined,
  message: undefined,
};

export const useDocumentStore = create<DocumentStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    documents: [],
    currentDocument: null,
    loading: initialLoading,
    filters: initialFilters,
    pagination: initialPagination,
    uploadProgress: 0,

    // State setters
    setDocuments: (documents) => set({ documents }),
    setCurrentDocument: (document) => set({ currentDocument: document }),
    setLoading: (loading) => set((state) => ({ loading: { ...state.loading, ...loading } })),
    setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
    setPagination: (pagination) => set((state) => ({ pagination: { ...state.pagination, ...pagination } })),
    setUploadProgress: (progress) => set({ uploadProgress: progress }),

    // Async actions
    fetchDocuments: async () => {
      const { filters, pagination } = get();
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await documentService.getDocuments(filters, pagination);

        if (response.success && response.data) {
          const { documents, pagination: newPagination } = response.data;
          set({
            documents,
            pagination: newPagination,
            loading: { isLoading: false },
          });
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to fetch documents' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    // Load more documents (append to existing list)
    loadMoreDocuments: async () => {
      const { filters, pagination, loading } = get();
      if (!pagination.hasMore || loading.isLoading) return;

      set({ loading: { isLoading: true, error: undefined } });

      try {
        const nextPage = pagination.page + 1;
        const response = await documentService.getDocuments(filters, { ...pagination, page: nextPage });

        if (response.success && response.data) {
          const { documents: newDocuments, pagination: newPagination } = response.data;
          set((state) => ({
            documents: [...state.documents, ...newDocuments],
            pagination: newPagination,
            loading: { isLoading: false },
          }));
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to load more documents' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    fetchDocument: async (id: string) => {
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await documentService.getDocument(id);

        if (response.success && response.data) {
          set({
            currentDocument: response.data,
            loading: { isLoading: false },
          });
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to fetch document' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    uploadDocument: async (file: File) => {
      set({ loading: { isLoading: true, error: undefined }, uploadProgress: 0 });

      try {
        const response = await documentService.uploadDocument(file, (progress) => {
          set({ uploadProgress: progress });
        });

        if (response.success && response.data) {
          const newDocument = response.data;
          set((state) => ({
            documents: [newDocument, ...state.documents],
            loading: { isLoading: false, message: 'Document uploaded successfully' },
            uploadProgress: 100,
          }));

          // Don't immediately refetch - let the smart polling handle status updates
          // The polling will automatically detect processing documents and update accordingly

          return newDocument;
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to upload document' } });
          return null;
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
        return null;
      }
    },

    deleteDocument: async (id: string) => {
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await documentService.deleteDocument(id);

        if (response.success) {
          set((state) => ({
            documents: state.documents.filter(doc => doc.id !== id),
            currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
            loading: { isLoading: false, message: 'Document deleted successfully' },
          }));
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to delete document' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    reprocessDocument: async (id: string) => {
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await documentService.reprocessDocument(id);

        if (response.success && response.data) {
          const updatedDocument = response.data;
          set((state) => ({
            documents: state.documents.map(doc =>
              doc.id === id ? updatedDocument : doc
            ),
            currentDocument: state.currentDocument?.id === id ? updatedDocument : state.currentDocument,
            loading: { isLoading: false, message: 'Document reprocessing started' },
          }));
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to reprocess document' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    searchDocuments: async (query: string) => {
      set({ loading: { isLoading: true, error: undefined } });

      try {
        const response = await documentService.searchDocuments(query);

        if (response.success && response.data) {
          set({
            documents: response.data.documents,
            loading: { isLoading: false },
          });
        } else {
          set({ loading: { isLoading: false, error: response.error || 'Failed to search documents' } });
        }
      } catch (error) {
        set({ loading: { isLoading: false, error: (error as Error).message } });
      }
    },

    // Utilities
    getDocumentById: (id: string) => {
      return get().documents.find(doc => doc.id === id);
    },

    updateDocument: (id: string, updates: Partial<Document>) => {
      set((state) => ({
        documents: state.documents.map(doc =>
          doc.id === id ? { ...doc, ...updates } : doc
        ),
        currentDocument: state.currentDocument?.id === id
          ? { ...state.currentDocument, ...updates }
          : state.currentDocument,
      }));
    },

    removeDocument: (id: string) => {
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
      }));
    },

    clearDocuments: () => {
      set({ documents: [], currentDocument: null });
    },

    resetFilters: () => {
      set({ filters: initialFilters, pagination: initialPagination });
    },

    handleStatusFilter: (status: DocumentStatus) => {
      set((state) => {
        const newStatuses = state.filters.status?.includes(status)
          ? state.filters.status.filter(s => s !== status)
          : [...(state.filters.status || []), status];

        return {
          filters: { ...state.filters, status: newStatuses },
          pagination: initialPagination,
        };
      });
    },
  }))
);

// Removed automatic subscriptions to prevent excessive API calls
// Refetches should be triggered manually by user actions or polling