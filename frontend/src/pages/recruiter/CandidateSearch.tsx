import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Chip,
  MenuItem,
  Pagination,
  Alert,
  alpha,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Psychology as PsychologyIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { searchCandidates, setQuery } from '../../store/slices/searchSlice';
import { fetchJobs } from '../../store/slices/jobSlice';
import { shortlistApi } from '../../api/matching';
import { CandidateDetailsModal } from '../../components/recruiter/CandidateDetailsModal';
import type { SearchResult } from '../../types';

export const CandidateSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { results, totalCount, isLoading, error, query } = useAppSelector((state) => state.search);
  const { jobs } = useAppSelector((state) => state.jobs);
  
  const [selectedJobId, setSelectedJobId] = useState('');
  const [filters, setFilters] = useState({ sector: '', location: '', minExperience: 0 });
  const [page, setPage] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<SearchResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [shortlistMsg, setShortlistMsg] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const result = await dispatch(fetchJobs({}) as any);
      
      // Handle jobId from query params
      const params = new URLSearchParams(location.search);
      const jobId = params.get('jobId');
      if (jobId) {
        setSelectedJobId(jobId);
        
        // Auto-populate Sector and Location from the query-param job
        const fetchedJobs = result.payload || [];
        const job = fetchedJobs.find((j: any) => j.id === jobId);
        if (job) {
          setFilters({
            sector: job.sector || '',
            location: job.location || '',
            minExperience: 0,
          });
        }
        
        dispatch(searchCandidates({ 
          job_id: jobId, 
          limit: 10, 
          page: 0,
          sector: job?.sector || undefined,
          location: job?.location || undefined,
        }));
      }
    };
    init();
  }, [dispatch, location.search]);

  const handleSearch = (pageNumber: number = page) => {
    dispatch(searchCandidates({
      query: query || undefined,
      job_id: selectedJobId || undefined,
      limit: 10,
      page: (pageNumber - 1) * 10,
      sector: filters.sector || undefined,
      location: filters.location || undefined,
      min_experience: filters.minExperience || undefined,
    }));
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        setFilters({
          ...filters,
          sector: job.sector || '',
          location: job.location || '',
        });
      }
    } else {
      setFilters({
        sector: '',
        location: '',
        minExperience: 0,
      });
    }
  };

  const handleShortlist = async (candidate: SearchResult) => {
    try {
      const lists = await shortlistApi.getShortlists();
      if (!Array.isArray(lists)) {
        throw new Error("Expected an array of shortlists");
      }
      let listId: string;
      
      const job = jobs.find(j => j.id === selectedJobId);
      const targetName = job ? `Shortlist: ${job.title}` : 'Manual Search Results';
      
      // Find existing list for this job or manual search
      const existing = lists.find(l => l.name === targetName);
      
      if (existing) {
        listId = existing.id;
      } else {
        const created = await shortlistApi.createShortlist(targetName, selectedJobId || undefined);
        listId = created.id;
      }

      await shortlistApi.addCandidate(
        listId, 
        candidate.candidate_id, 
        candidate.name, 
        candidate.score, 
        candidate.matched_skills
      );
      setShortlistMsg(`${candidate.name} added to ${targetName}.`);
      setTimeout(() => setShortlistMsg(null), 3000);
    } catch {
      setShortlistMsg('Failed to add to shortlist.');
      setTimeout(() => setShortlistMsg(null), 3000);
    }
  };

  const handleOpenExplanation = (candidate: SearchResult) => {
    setSelectedCandidate(candidate);
    setModalOpen(true);
  };

  const sectors = ['Engineering', 'Finance', 'IT', 'Medical', 'Mining', 'Supply Chain', 'Trade & Technical'];

  return (
    <Box sx={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
          AI Talent Discovery
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {selectedJobId 
            ? 'Matching candidates against your selected job position using RAG analysis.' 
            : 'Describe your ideal candidate in natural language to search across the database.'}
        </Typography>
      </Box>

      {/* ── Search & Match panel ─────────────────────────── */}
      <Card sx={{ mb: 4, overflow: 'visible', border: selectedJobId ? '1px solid' : 'none', borderColor: 'primary.main' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Match by Job Position</InputLabel>
                <Select
                  value={selectedJobId}
                  label="Match by Job Position"
                  onChange={(e) => handleJobSelect(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <WorkIcon sx={{ color: selectedJobId ? 'primary.main' : 'text.secondary', ml: 1, mr: -0.5 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value=""><em>None (Manual Search)</em></MenuItem>
                  {jobs.filter(j => j.status === 'OPEN').map((job) => (
                    <MenuItem key={job.id} value={job.id}>
                      {job.title} ({job.location})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                fullWidth
                placeholder={selectedJobId ? "Refine match with keywords (optional)..." : "e.g. Senior Python developer with 5 years experience"}
                value={query}
                onChange={(e) => dispatch(setQuery(e.target.value))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Industry Sector"
                value={filters.sector}
                onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              >
                <MenuItem value="">All Sectors</MenuItem>
                {sectors.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                fullWidth
                label="Preferred Location"
                placeholder="e.g. Cape Town"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <TextField
                fullWidth
                label="Min. Years Exp."
                type="number"
                value={filters.minExperience}
                onChange={(e) => setFilters({ ...filters, minExperience: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => {
                  setPage(1);
                  handleSearch(1);
                }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : (selectedJobId ? <PsychologyIcon /> : <SearchIcon />)}
                sx={{ height: 56 }}
              >
                {isLoading ? 'Analyzing...' : (selectedJobId ? 'Run AI Matching' : 'Search Candidates')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {shortlistMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{shortlistMsg}</Alert>}

      {results.length > 0 ? (
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {selectedJobId ? 'AI-ranked candidates for this position' : `Found ${totalCount} matching candidates`}
          </Typography>
          {results.map((candidate) => (
            <Card
              key={candidate.candidate_id}
              variant="outlined"
              onClick={() => handleOpenExplanation(candidate)}
              sx={{
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: alpha('#7EC845', 0.02),
                  transform: 'translateY(-1px)',
                  boxShadow: 2,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 12, md: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha('#1B2A4A', 0.06),
                        }}
                      >
                        <PersonIcon sx={{ color: 'text.secondary' }} />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{candidate.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {candidate.rationale}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {candidate.matched_skills.slice(0, 5).map((skill) => (
                        <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                      ))}
                      {candidate.matched_skills.length > 5 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          +{candidate.matched_skills.length - 5} more
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Tooltip title="Proprietary AI Semantic Match Score" arrow>
                      <Box sx={{ textAlign: 'center', cursor: 'help' }}>
                        <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>
                          {Math.round(candidate.score)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">AI Match Score</Typography>
                      </Box>
                    </Tooltip>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <Tooltip title="View AI rationale for this match" arrow>
                        <Button
                          variant="outlined"
                          startIcon={<PsychologyIcon />}
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleOpenExplanation(candidate); }}
                          sx={{ borderRadius: 2 }}
                        >
                          Explain
                        </Button>
                      </Tooltip>
                      <Tooltip title="Add candidate to a shortlist" arrow>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          size="small"
                          color="secondary"
                          onClick={(e) => { e.stopPropagation(); handleShortlist(candidate); }}
                          sx={{ borderRadius: 2 }}
                        >
                          Shortlist
                        </Button>
                      </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.ceil(totalCount / 10)}
              page={page}
              onChange={(_, value) => {
                setPage(value);
                handleSearch(value);
              }}
              color="primary"
            />
          </Box>
        </Stack>
      ) : !isLoading && (query || selectedJobId) && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">No candidates found matching your criteria.</Typography>
        </Box>
      )}

      <CandidateDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        candidate={selectedCandidate}
      />
    </Box>
  );
};
