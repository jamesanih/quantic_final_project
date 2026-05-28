import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Stack,
  Chip,
  Divider,
  Button,
  Alert,
  Grid,
  alpha,
  Tabs,
  Tab,
  Avatar,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Psychology as PsychologyIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Assignment as ResumeIcon,
} from '@mui/icons-material';
import { cvApi } from '../../api/cv';
import type { SearchResult, CV } from '../../types';

interface CandidateDetailsModalProps {
  open: boolean;
  onClose: () => void;
  candidate: SearchResult | null;
}

export const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({
  open,
  onClose,
  candidate,
}) => {
  if (!candidate) return null;

  const [activeTab, setActiveTab] = useState<'match' | 'profile'>('match');
  const [cvDetails, setCvDetails] = useState<CV | null>(null);
  const [isLoadingCv, setIsLoadingCv] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Parse CV ID from Candidate ID
  const cvId = candidate.candidate_id.replace('cand-', '');

  useEffect(() => {
    if (!open) {
      // Reset state when closing
      setActiveTab('match');
      setCvDetails(null);
      return;
    }

    const fetchCvProfile = async () => {
      setIsLoadingCv(true);
      try {
        const data = await cvApi.getCV(cvId);
        if (data && data.status && data.status !== 'FAILED') {
          setCvDetails(data);
        }
      } catch (err) {
        console.warn('Could not load detailed CV for candidate', cvId, err);
      } finally {
        setIsLoadingCv(false);
      }
    };

    fetchCvProfile();
  }, [open, cvId]);

  const handleFeedback = (type: string) => {
    setFeedback(`Thanks! You rated this match as "${type}".`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const score = Math.round(candidate.score);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth 
      slotProps={{ 
        paper: { 
          sx: { 
            borderRadius: 4, 
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(27,42,74,0.18)',
          } 
        } 
      }}
    >
      {/* ── Dialog Header with Navigation Tabs ───────────────── */}
      <Box sx={{ background: `linear-gradient(135deg, ${alpha('#1B2A4A', 0.08)}, ${alpha('#7EC845', 0.04)})`, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, boxShadow: '0 4px 12px rgba(255,107,53,0.2)' }}>
              {candidate.name[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {candidate.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Candidate Profile & AI Insights
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ borderRadius: 1.5 }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ px: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab 
              value="match" 
              label="AI Match Insights" 
              icon={<PsychologyIcon fontSize="small" />} 
              iconPosition="start"
              sx={{ fontWeight: 700, textTransform: 'none', minHeight: 48 }}
            />
            <Tab 
              value="profile" 
              label="Detailed Resume" 
              icon={<ResumeIcon fontSize="small" />} 
              iconPosition="start"
              sx={{ fontWeight: 700, textTransform: 'none', minHeight: 48 }}
            />
          </Tabs>
        </Box>
      </Box>

      {/* ── Dialog Content ──────────────────────────────────── */}
      <DialogContent sx={{ p: 4, minHeight: 380, bgcolor: activeTab === 'profile' ? '#F8F9FC' : '#fff' }}>
        
        {/* ── TAB 1: AI Match Insights ─────────────────────── */}
        {activeTab === 'match' && (
          <Stack spacing={3.5}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Overall Match Fit
                </Typography>
                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>
                  {score}/100
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={score} 
                sx={{ 
                  height: 12, 
                  borderRadius: 6,
                  bgcolor: alpha('#7EC845', 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: score >= 80 ? '#339345' : score >= 60 ? '#7EC845' : '#FF9800',
                  }
                }} 
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                AI Score Rationale
              </Typography>
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: alpha('#7EC845', 0.04),
                  borderRadius: 3,
                  borderLeft: '4px solid',
                  borderColor: 'primary.main',
                }}
              >
                <Typography variant="body2" sx={{ fontStyle: 'italic', lineHeight: 1.7, color: 'text.primary' }}>
                  "{candidate.rationale}"
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    mb: 1.5,
                    color: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 18 }} /> Matched Skills
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {candidate.matched_skills.map((skill) => (
                    <Chip key={skill} label={skill} size="small" color="success" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 500 }} />
                  ))}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    mb: 1.5,
                    color: 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <CancelIcon sx={{ fontSize: 18 }} /> Missing Skills
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {candidate.missing_skills && candidate.missing_skills.length > 0 ? (
                    candidate.missing_skills.map((skill) => (
                      <Chip key={skill} label={skill} size="small" color="error" variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 500 }} />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">None identified</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Divider />

            <Box>
              <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary', fontWeight: 500 }}>
                Was this AI score accurate?
              </Typography>
              {feedback && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{feedback}</Alert>}
              <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
                <Button startIcon={<ThumbUpIcon />} variant="outlined" color="success" size="small" sx={{ borderRadius: 2 }} onClick={() => handleFeedback('Accurate')}>
                  Accurate
                </Button>
                <Button startIcon={<ThumbDownIcon />} variant="outlined" color="warning" size="small" sx={{ borderRadius: 2 }} onClick={() => handleFeedback('Underrated')}>
                  Underrated
                </Button>
                <Button startIcon={<ThumbDownIcon />} variant="outlined" color="error" size="small" sx={{ borderRadius: 2 }} onClick={() => handleFeedback('Overrated')}>
                  Overrated
                </Button>
              </Stack>
            </Box>
          </Stack>
        )}

        {/* ── TAB 2: Detailed Resume ───────────────────────── */}
        {activeTab === 'profile' && (
          <Box>
            {isLoadingCv ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">Fetching complete resume metadata...</Typography>
              </Box>
            ) : cvDetails && cvDetails.extracted_data ? (
              <Grid container spacing={3}>
                {/* Left Side: Personal Contact Details & Skills */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                        Contact Details
                      </Typography>
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{cvDetails.extracted_data.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{cvDetails.extracted_data.email || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{cvDetails.extracted_data.phone || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{cvDetails.extracted_data.location || 'N/A'}</Typography>
                        </Box>
                      </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                        All Extracted Skills
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                        {cvDetails.extracted_data.skills?.map((skill, idx) => (
                          <Chip key={idx} label={skill} size="small" variant="outlined" color="primary" sx={{ borderRadius: 1.5, fontWeight: 500 }} />
                        )) || <Typography variant="body2" color="text.secondary">No skills extracted.</Typography>}
                      </Box>
                    </Paper>
                  </Stack>
                </Grid>

                {/* Right Side: Experiences & Education */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                        Work Experience Timeline
                      </Typography>
                      <Stack spacing={2.5}>
                        {cvDetails.extracted_data.work_experiences && cvDetails.extracted_data.work_experiences.length > 0 ? (
                          cvDetails.extracted_data.work_experiences.map((exp, idx) => (
                            <Box key={idx}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                <WorkIcon sx={{ mt: 0.3, color: 'text.secondary', fontSize: 18 }} />
                                <Box sx={{ width: '100%' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{exp.title}</Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{exp.company}</Typography>
                                    <Typography variant="caption" color="text.disabled">{exp.start_date} - {exp.end_date || 'Present'}</Typography>
                                  </Box>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>{exp.description}</Typography>
                                </Box>
                              </Box>
                              {idx < cvDetails.extracted_data!.work_experiences.length - 1 && <Divider sx={{ mt: 2 }} />}
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">No experience details available.</Typography>
                        )}
                      </Stack>
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff' }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2 }}>
                        Education History
                      </Typography>
                      <Stack spacing={2}>
                        {cvDetails.extracted_data.education && cvDetails.extracted_data.education.length > 0 ? (
                          cvDetails.extracted_data.education.map((edu, idx) => (
                            <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                              <SchoolIcon sx={{ mt: 0.3, color: 'text.secondary', fontSize: 18 }} />
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{edu.qualification}</Typography>
                                <Typography variant="body2" color="text.secondary">{edu.institution} ({edu.year})</Typography>
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">No education details available.</Typography>
                        )}
                      </Stack>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            ) : (
              <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#fff', border: '1px dashed', borderColor: 'divider' }}>
                <ResumeIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 700 }}>
                  Detailed CV Profile Not Found
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
                  This candidate has not uploaded a parsed resume file. You can see their AI-evaluated matched/missing skills under the Match Insights tab.
                </Typography>
                {/* Fallback Display of available basic details */}
                <Box sx={{ p: 2, bgcolor: alpha('#1B2A4A', 0.03), borderRadius: 3, textAlign: 'left', maxWidth: 440, mx: 'auto' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 700 }}>Available Overview</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Name:</strong> {candidate.name}</Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>Matched Skills:</strong> {candidate.matched_skills.join(', ')}</Typography>
                  {candidate.missing_skills && candidate.missing_skills.length > 0 && (
                    <Typography variant="body2"><strong>Missing Skills:</strong> {candidate.missing_skills.join(', ')}</Typography>
                  )}
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
