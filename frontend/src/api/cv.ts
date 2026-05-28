import apiClient from './client';
import type { CV } from '../types';

export const cvApi = {
  upload: async (file: File): Promise<CV> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/cvs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  bulkUpload: async (files: File[]): Promise<CV[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await apiClient.post('/api/cvs/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getCV: async (id: string): Promise<CV> => {
    const response = await apiClient.get(`/api/cvs/${id}`);
    return response.data;
  },

  getMyCVs: async (): Promise<CV[]> => {
    const response = await apiClient.get('/api/cvs/me');
    return response.data;
  },

  deleteCV: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/cvs/${id}`);
  },
};
