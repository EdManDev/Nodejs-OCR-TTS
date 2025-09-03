import { apiClient } from './api';
import { Voice, TTSOptions, ApiResponse } from '@/types';

export class TTSService {
  // Get available voices
  async getVoices(): Promise<ApiResponse<Voice[]>> {
    return apiClient.get('/tts/voices');
  }

  // Synthesize text to speech
  async synthesizeText(
    text: string,
    options: TTSOptions
  ): Promise<ApiResponse<{ audioUrl: string; duration: number }>> {
    return apiClient.post('/tts/synthesize', { text, options });
  }

  // Start TTS processing for a document
  async processDocument(
    documentId: string,
    options: TTSOptions
  ): Promise<ApiResponse<{ jobId: string }>> {
    return apiClient.post(`/tts/documents/${documentId}/process`, { options });
  }

  // Get TTS processing status for a document
  async getDocumentTTSStatus(documentId: string): Promise<ApiResponse<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    totalChunks: number;
    processedChunks: number;
    estimatedTimeRemaining?: number;
    audioFiles: Array<{
      chunkId: string;
      audioUrl: string;
      duration: number;
    }>;
  }>> {
    return apiClient.get(`/tts/documents/${documentId}/status`);
  }

  // Get audio for a specific chunk
  async getChunkAudio(chunkId: string): Promise<ApiResponse<{ audioUrl: string; duration: number }>> {
    return apiClient.get(`/tts/chunks/${chunkId}/audio`);
  }

  // Cancel TTS processing for a document
  async cancelDocumentTTS(documentId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/tts/documents/${documentId}/cancel`);
  }

  // Get TTS job details
  async getTTSJob(jobId: string): Promise<ApiResponse<{
    id: string;
    documentId: string;
    status: string;
    progress: number;
    options: TTSOptions;
    createdAt: string;
    completedAt?: string;
    error?: string;
  }>> {
    return apiClient.get(`/tts/jobs/${jobId}`);
  }

  // Download all audio files for a document as a zip
  async downloadDocumentAudio(documentId: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.get(`/tts/documents/${documentId}/download`);
  }

  // Get TTS statistics
  async getTTSStats(): Promise<ApiResponse<{
    totalSynthesized: number;
    totalDuration: number;
    averageProcessingTime: number;
    voiceUsage: Record<string, number>;
    recentActivity: Array<{
      date: string;
      synthesized: number;
      duration: number;
    }>;
  }>> {
    return apiClient.get('/tts/stats');
  }

  // Test voice with sample text
  async testVoice(
    voiceId: string,
    sampleText?: string
  ): Promise<ApiResponse<{ audioUrl: string; duration: number }>> {
    return apiClient.post('/tts/test-voice', {
      voiceId,
      text: sampleText || 'This is a sample text to test the voice quality and characteristics.'
    });
  }
}

export const ttsService = new TTSService();