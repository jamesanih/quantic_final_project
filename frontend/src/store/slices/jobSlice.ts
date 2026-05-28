import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jobApi } from '../../api/jobs';
import type { Job, JobApplication } from '../../types';

interface JobState {
  jobs: Job[];
  currentJob: Job | null;
  applications: JobApplication[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: JobState = {
  jobs: [],
  currentJob: null,
  applications: [],
  total: 0,
  isLoading: false,
  error: null,
};

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params: { search?: string; status?: string; page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      return await jobApi.getJobs(params);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch jobs');
    }
  }
);

export const fetchApplications = createAsyncThunk(
  'jobs/fetchApplications',
  async (_, { rejectWithValue }) => {
    try {
      return await jobApi.getApplications();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch applications');
    }
  }
);

export const createJob = createAsyncThunk(
  'jobs/createJob',
  async (data: Partial<Job>, { rejectWithValue }) => {
    try {
      return await jobApi.createJob(data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(err.response?.data?.detail || 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk(
  'jobs/updateJob',
  async ({ id, data }: { id: string; data: Partial<Job> }, { rejectWithValue }) => {
    try {
      return await jobApi.updateJob(id, data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(err.response?.data?.detail || 'Failed to update job');
    }
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (id: string, { rejectWithValue }) => {
    try {
      await jobApi.deleteJob(id);
      return id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete job');
    }
  }
);

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearJobError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        const p = action.payload;
        if (Array.isArray(p)) {
          state.jobs = p;
          state.total = p.length;
        } else if (p && typeof p === 'object') {
          state.jobs = p.jobs || [];
          state.total = p.total || 0;
        }
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.applications = action.payload;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.jobs.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.jobs.findIndex(j => j.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.jobs = state.jobs.filter(j => j.id !== action.payload);
        state.total = state.jobs.length;
      });
  },
});

export const { clearJobError } = jobSlice.actions;
export default jobSlice.reducer;
