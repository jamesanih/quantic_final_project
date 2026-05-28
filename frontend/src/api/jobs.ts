import apiClient from './client';
import type { Job, JobApplication } from '../types';

export const jobApi = {
  getJobs: async (params?: { search?: string; status?: string; sector?: string; page?: number; limit?: number }): Promise<{ jobs: Job[]; total: number }> => {
    const response = await apiClient.get('/api/jobs', { params });
    return response.data;
  },

  getJob: async (id: string): Promise<Job> => {
    const response = await apiClient.get(`/api/jobs/${id}`);
    return response.data;
  },

  createJob: async (data: Partial<Job>): Promise<Job> => {
    const response = await apiClient.post('/api/jobs', data);
    return response.data;
  },

  updateJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    const response = await apiClient.put(`/api/jobs/${id}`, data);
    return response.data;
  },

  applyForJob: async (jobId: string): Promise<JobApplication> => {
    const response = await apiClient.post(`/api/jobs/${jobId}/apply`);
    return response.data;
  },

  getApplications: async (): Promise<JobApplication[]> => {
    const response = await apiClient.get('/api/applications');
    return response.data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/jobs/${id}`);
  },
};
