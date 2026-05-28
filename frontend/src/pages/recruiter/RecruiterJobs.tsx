import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack, CircularProgress, alpha, Avatar,
  Tooltip, Paper, Divider,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Work as WorkIcon, LocationOn as LocationOnIcon,
  Psychology as PsychologyIcon,
  ChevronRight as ChevronRightIcon, Business as BusinessIcon,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { fetchJobs, createJob, updateJob, deleteJob } from '../../store/slices/jobSlice';
import { vectorApi } from '../../api/vector';
import { shortlistApi } from '../../api/matching';
import type { Job, SearchResult } from '../../types';
import { MatchExplanationModal } from '../../components/recruiter/MatchExplanationModal';

const statusConfig: Record<string, { color: 'success' | 'error' | 'warning' | 'default'; label: string; bg: string }> = {
  OPEN:   { color: 'success', label: 'Active', bg: '#E8F5E9' },
  CLOSED: { color: 'error', label: 'Closed', bg: '#FFEBEE' },
  DRAFT:  { color: 'warning', label: 'Draft', bg: '#FFF3E0' },
};

const sectors = ['Engineering', 'Finance', 'IT', 'Medical', 'Mining', 'Supply Chain', 'Hospitality'];

export const RecruiterJobs: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { jobs, isLoading } = useAppSelector((state) => state.jobs);

  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<SearchResult[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState<Job | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<SearchResult | null>(null);
  const [explanationModalOpen, setExplanationModalOpen] = useState(false);
  const [shortlistMsg, setShortlistMsg] = useState<string | null>(null);

  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '', description: '', requirements: '', required_skills: [],
    location: '', sector: 'IT', status: 'OPEN', salary_range: '',
  });

  useEffect(() => { dispatch(fetchJobs({}) as any); }, [dispatch]);

  const handleCreate = async () => {
    try {
      if (isEditing && newJob.id) {
        const resultAction = await dispatch(updateJob({ id: newJob.id, data: newJob }) as any);
        if (updateJob.fulfilled.match(resultAction)) {
          handleClose();
        }
      } else {
        const resultAction = await dispatch(createJob(newJob) as any);
        if (createJob.fulfilled.match(resultAction)) {
          setLastCreatedJob(resultAction.payload as Job);
          handleClose();
          setIsRecommending(true);
          setRecommendationsOpen(true);
          try {
            const resp = await vectorApi.search({ query: `${newJob.title} ${newJob.requirements}`, limit: 5 });
            setRecommendations(resp.candidates);
          } catch { /* silent */ }
          finally { setIsRecommending(false); }
        }
      }
    } catch { /* silent */ }
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
    setNewJob({ title: '', description: '', requirements: '', required_skills: [], location: '', sector: 'IT', status: 'OPEN', salary_range: '' });
  };
  const handleShortlist = async (c: SearchResult) => {
    try {
      const lists = await shortlistApi.getShortlists();
      const listId = lists.length > 0 ? lists[0].id : (await shortlistApi.createShortlist('Job Matches')).id;
      await shortlistApi.addCandidate(listId, c.candidate_id, c.name, c.score, c.matched_skills);
      setShortlistMsg(`${c.name} added!`);
      setTimeout(() => setShortlistMsg(null), 2500);
    } catch { /* silent */ }
  };

  const openCount = jobs.filter(j => j.status === 'OPEN').length;
  const draftCount = jobs.filter(j => j.status === 'DRAFT').length;
  const closedCount = jobs.filter(j => j.status === 'CLOSED').length;

  return (
    <Box sx={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* ── Header + Stats ──────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
              Job Management
            </Typography>
            <Typography variant="body1" color="text.secondary">Post and manage your open positions across Africa</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} size="large" sx={{ px: 3, py: 1.5, borderRadius: 2.5, fontWeight: 700 }}>
            Post New Position
          </Button>
        </Box>
        <Stack direction="row" spacing={2}>
          {[
            { label: 'Active', count: openCount, color: '#339345' },
            { label: 'Drafts', count: draftCount, color: '#FF9800' },
            { label: 'Closed', count: closedCount, color: '#F44336' },
            { label: 'Total', count: jobs.length, color: '#1B2A4A' },
          ].map(s => (
            <Paper key={s.label} sx={{ px: 2.5, py: 1.5, borderRadius: 2.5, bgcolor: alpha(s.color, 0.06), border: `1px solid ${alpha(s.color, 0.15)}`, minWidth: 90 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>{s.count}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* ── Job Grid ─────────────────────────────────────── */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : jobs.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 10, borderRadius: 4, border: '2px dashed', borderColor: 'divider', bgcolor: '#F8F9FC' }}>
          <Box sx={{ width: 88, height: 88, borderRadius: '50%', mx: 'auto', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${alpha('#7EC845', 0.12)}, ${alpha('#1B2A4A', 0.08)})` }}>
            <WorkIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>No positions posted yet</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            Create your first job listing and our AI will instantly match the best candidates.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} size="large" sx={{ borderRadius: 2.5 }}>
            Create First Job
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {jobs.map(job => {
            const config = statusConfig[job.status] || statusConfig.OPEN;
            return (
              <Grid size={{ xs: 12, md: 6 }} key={job.id}>
                <Card sx={{
                  position: 'relative', overflow: 'hidden', borderRadius: 3,
                  border: '1px solid', borderColor: 'divider',
                  transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.1)', borderColor: 'primary.main' },
                }}>
                  <Box sx={{ height: 4, background: `linear-gradient(90deg, ${config.color === 'success' ? '#339345' : config.color === 'warning' ? '#FF9800' : '#F44336'}, ${config.color === 'success' ? '#66BB6A' : config.color === 'warning' ? '#FFB74D' : '#EF5350'})` }} />
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1, mr: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{job.title}</Typography>
                        {job.client_name && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <BusinessIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption">{job.client_name}</Typography>
                          </Box>
                        )}
                      </Box>
                      <Chip label={config.label} size="small" sx={{ bgcolor: config.bg, color: config.color === 'success' ? '#2E7D32' : config.color === 'warning' ? '#E65100' : '#C62828', fontWeight: 700, borderRadius: 2, px: 1 }} />
                    </Box>
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                      {job.location && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}><LocationOnIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{job.location}</Typography></Box>}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}><WorkIcon sx={{ fontSize: 15 }} /><Typography variant="caption">{job.sector}</Typography></Box>
                      {job.salary_range && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}><TrendingUp sx={{ fontSize: 15 }} /><Typography variant="caption">{job.salary_range}</Typography></Box>}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{job.description}</Typography>
                    {(job.required_skills || []).length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {(job.required_skills || []).slice(0, 5).map(s => <Chip key={s} label={s} size="small" variant="outlined" color="primary" sx={{ borderRadius: 1.5, fontSize: '0.7rem', height: 22 }} />)}
                        {(job.required_skills || []).length > 5 && <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>+{job.required_skills!.length - 5} more</Typography>}
                      </Box>
                    )}
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title="AI Match candidates" arrow>
                        <Button size="small" variant="text" startIcon={<PsychologyIcon />} onClick={() => navigate(`/recruiter/search?jobId=${job.id}`)} sx={{ borderRadius: 2 }}>AI Match</Button>
                      </Tooltip>
                      <Tooltip title="Edit this mandate" arrow>
                        <IconButton size="small" sx={{ borderRadius: 1.5 }} onClick={() => { setNewJob(job); setIsEditing(true); setOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete this position" arrow>
                        <IconButton size="small" color="error" sx={{ borderRadius: 1.5 }} onClick={() => { if (window.confirm("Are you sure you want to delete this position?")) { dispatch(deleteJob(job.id) as any); } }}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Create Dialog ──────────────────────────────────── */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden' } } }}>
        <Box sx={{ background: `linear-gradient(135deg, ${alpha('#1B2A4A', 0.06)}, ${alpha('#7EC845', 0.04)})`, px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <DialogTitle sx={{ p: 0, fontWeight: 700, fontSize: '1.25rem' }}>{isEditing ? 'Edit Mandate' : 'Post New Position'}</DialogTitle>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Job Title" fullWidth placeholder="e.g. Senior Python Developer" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} />
            <TextField label="Client / Company" fullWidth placeholder="e.g. TechFlow Solutions" value={newJob.client_name || ''} onChange={e => setNewJob({ ...newJob, client_name: e.target.value })} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}><TextField label="Location" fullWidth placeholder="Cape Town" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} /></Grid>
              <Grid size={{ xs: 6 }}><TextField select label="Sector" fullWidth value={newJob.sector} onChange={e => setNewJob({ ...newJob, sector: e.target.value })}>{sectors.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField></Grid>
            </Grid>
            <TextField label="Salary Range" fullWidth placeholder="e.g. R800k - R1.2M" value={newJob.salary_range || ''} onChange={e => setNewJob({ ...newJob, salary_range: e.target.value })} />
            <TextField label="Description" fullWidth multiline rows={3} value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} />
            <TextField label="Requirements" fullWidth multiline rows={2} placeholder="Key skills, certifications, years of experience..." value={newJob.requirements} onChange={e => setNewJob({ ...newJob, requirements: e.target.value })} />
            <TextField label="Required Skills (comma-separated)" fullWidth placeholder="Python, FastAPI, PostgreSQL, Docker" value={(newJob.required_skills || []).join(', ')} onChange={e => setNewJob({ ...newJob, required_skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newJob.title} sx={{ borderRadius: 2, px: 4 }}>{isEditing ? 'Save Changes' : 'Post Job & Match'}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Recommendations Dialog ────────────────────────── */}
      <Dialog open={recommendationsOpen} onClose={() => setRecommendationsOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4, bgcolor: '#F8FAFC' } } }}>
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Avatar sx={{ bgcolor: alpha('#7EC845', 0.15), color: '#7EC845', width: 40, height: 40 }}><PsychologyIcon /></Avatar>
            <Box><Typography variant="h6" sx={{ fontWeight: 700 }}>AI Candidate Matches</Typography><Typography variant="body2" color="text.secondary">For <strong>{lastCreatedJob?.title}</strong></Typography></Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><PsychologyIcon fontSize="small" /> INSTANT MATCH RECOMMENDATIONS</Typography>
          {shortlistMsg && <Paper sx={{ mb: 2, p: 1.5, bgcolor: alpha('#339345', 0.08), border: `1px solid ${alpha('#339345', 0.2)}`, borderRadius: 2 }}><Typography variant="body2" sx={{ color: '#2E7D32', fontWeight: 600 }}>{shortlistMsg}</Typography></Paper>}
          {isRecommending ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={40} sx={{ mb: 2 }} /><Typography variant="body2" color="text.secondary">Ranking candidates...</Typography></Box>
          : recommendations.length === 0 ? <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No matches found. Try broader requirements.</Typography>
          : <Stack spacing={2}>{recommendations.map(c => (
            <Card key={c.candidate_id} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.main' } }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Grid container spacing={2} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 12, sm: 1 }}><Avatar sx={{ bgcolor: alpha('#7EC845', 0.1), color: '#7EC845', width: 44, height: 44, fontWeight: 700 }}>{c.name[0]}</Avatar></Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{c.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>{c.matched_skills.slice(0, 4).map(s => <Chip key={s} label={s} size="small" variant="outlined" color="success" sx={{ height: 20, fontSize: '0.7rem', borderRadius: 1.5 }} />)}</Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }} sx={{ textAlign: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress variant="determinate" value={c.score} size={52} thickness={5} sx={{ color: c.score >= 80 ? '#339345' : c.score >= 60 ? '#7EC845' : '#FF9800' }} />
                      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography variant="caption" sx={{ fontWeight: 700 }}>{Math.round(c.score)}</Typography></Box>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}><Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                    <Tooltip title="View full AI analysis" arrow>
                      <Button size="small" variant="text" endIcon={<ChevronRightIcon />} onClick={() => { setSelectedCandidate(c); setExplanationModalOpen(true); }} sx={{ borderRadius: 2 }}>Details</Button>
                    </Tooltip>
                    <Tooltip title="Add this candidate to the shortlist" arrow>
                      <Button size="small" variant="outlined" color="secondary" onClick={() => handleShortlist(c)} sx={{ borderRadius: 2 }}>Shortlist</Button>
                    </Tooltip>
                  </Stack></Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}</Stack>}
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#fff', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setRecommendationsOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
          <Button variant="contained" onClick={() => { setRecommendationsOpen(false); navigate('/recruiter/search'); }} sx={{ borderRadius: 2 }}>View All</Button>
        </DialogActions>
      </Dialog>

      <MatchExplanationModal open={explanationModalOpen} onClose={() => setExplanationModalOpen(false)} candidate={selectedCandidate} />
    </Box>
  );
};
