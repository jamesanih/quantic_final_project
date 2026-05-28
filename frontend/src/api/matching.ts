import apiClient from './client';
import type { MatchingRequest, MatchingResult, Shortlist } from '../types';

export const matchingApi = {
  startMatching: async (data: MatchingRequest): Promise<{ job_id: string; status: string }> => {
    const response = await apiClient.post('/api/matching/start', data);
    return response.data;
  },

  getMatchingResults: async (jobId: string): Promise<MatchingResult[]> => {
    const response = await apiClient.get(`/api/matching/${jobId}/results`);
    return response.data;
  },
};

export const shortlistApi = {
  getShortlists: async (): Promise<Shortlist[]> => {
    const response = await apiClient.get('/api/shortlists');
    return response.data;
  },

  createShortlist: async (name: string, jobId?: string): Promise<Shortlist> => {
    const response = await apiClient.post('/api/shortlists', { name, job_id: jobId });
    return response.data;
  },

  getShortlist: async (id: string): Promise<Shortlist> => {
    const response = await apiClient.get(`/api/shortlists/${id}`);
    return response.data;
  },

  addCandidate: async (
    shortlistId: string, 
    candidateId: string, 
    candidateName: string,
    score: number,
    matchedSkills: string[],
    notes?: string
  ): Promise<void> => {
    await apiClient.post(`/api/shortlists/${shortlistId}/add`, {
      candidate_id: candidateId,
      candidate_name: candidateName,
      score,
      matched_skills: matchedSkills,
      notes,
    });
  },

  removeCandidate: async (shortlistId: string, candidateId: string): Promise<void> => {
    await apiClient.delete(`/api/shortlists/${shortlistId}/candidates/${candidateId}`);
  },

  exportShortlist: async (id: string, format: 'pdf' | 'excel'): Promise<Blob> => {
    const response = await apiClient.get(`/api/shortlists/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  deleteShortlist: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/shortlists/${id}`);
  },
};
