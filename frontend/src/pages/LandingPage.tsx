import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Stack,
  Container, CircularProgress, alpha, Divider, Avatar,
  Tooltip,
} from '@mui/material';
import {
  Work as WorkIcon, People as PeopleIcon,
  Psychology as PsychologyIcon, TrendingUp as TrendingUpIcon,
  LocationOn, Business, ArrowForward,
  AutoGraph as AutoGraphIcon, 
  Public as PublicIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jobApi } from '../api/jobs';
import type { Job } from '../types';
import { LandingNav } from '../components/layout/LandingNav';
import { AppFooter } from '../components/layout/AppFooter';

const statsData = [
  { icon: <WorkIcon />, value: '1,200+', label: 'Positions Filled' },
  { icon: <PeopleIcon />, value: '15,000+', label: 'Elite Talent Pool' },
  { icon: <PsychologyIcon />, value: '98%', label: 'Consultancy Accuracy' },
  { icon: <TrendingUpIcon />, value: '45%', label: 'Faster Placements' },
];

const features = [
  { 
    icon: <PsychologyIcon sx={{ fontSize: 40 }} />, 
    title: 'Expert AI Screening', 
    desc: 'Our consultants use proprietary RAG-powered engines to find the absolute best talent for our partner clients.' 
  },
  { 
    icon: <AutoGraphIcon sx={{ fontSize: 40 }} />, 
    title: 'Strategic Talent Mapping', 
    desc: 'We map the African tech ecosystem using AI to identify high-potential candidates before they even hit the market.' 
  },
  { 
    icon: <PublicIcon sx={{ fontSize: 40 }} />, 
    title: 'Pan-African Reach', 
    desc: 'From Cape Town to Lagos, we provide cross-border recruitment solutions powered by intelligent data analysis.' 
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobApi.getJobs({ status: 'OPEN', limit: 6 })
      .then(r => setJobs(r.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ bgcolor: '#fff', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <LandingNav />
      
      <Box sx={{ flex: 1 }}>
        {/* ── Hero Section ──────────────────────────────────── */}
        <Box 
          sx={{
            pt: { xs: 15, md: 22 },
            pb: { xs: 10, md: 15 },
            bgcolor: '#F8FAFC',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={8} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 6.5 }}>
                <Box>
                  <Typography 
                    variant="overline" 
                    sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.2em', mb: 2, display: 'block' }}
                  >
                    TUMAINI RECRUITMENT CONSULTANCY
                  </Typography>
                  <Typography 
                    variant="h1" 
                    sx={{ fontWeight: 900, fontSize: { xs: '2.5rem', md: '4rem' }, lineHeight: 1.1, mb: 3, letterSpacing: '-0.04em', color: '#1B2A4A' }}
                  >
                    AI-Powered<br />
                    <Box component="span" sx={{ color: 'primary.main' }}>Talent Solutions</Box>
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ color: 'text.secondary', mb: 5, maxWidth: 540, lineHeight: 1.6, fontWeight: 400 }}
                  >
                    We are a premier recruitment consultancy leveraging advanced AI to connect 
                    Africa's top professionals with world-class employers. Fast, fair, and data-driven.
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      onClick={() => navigate('/register')}
                      sx={{ px: 5, py: 2, borderRadius: 2.5, fontSize: '1rem', fontWeight: 700, boxShadow: '0 8px 30px rgba(126, 200, 69, 0.3)' }}
                    >
                      Apply for Roles
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large" 
                      onClick={() => navigate('/jobs')}
                      sx={{ px: 5, py: 2, borderRadius: 2.5, fontSize: '1rem', fontWeight: 700 }}
                    >
                      Partner with Us
                    </Button>
                  </Stack>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 5.5 }}>
                <Box sx={{ position: 'relative', display: { xs: 'none', md: 'block' } }}>
                  <Card 
                    sx={{ 
                      borderRadius: 4, 
                      background: '#fff',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: '0 40px 80px rgba(0,0,0,0.08)',
                      p: 4,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF5F56' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFBD2E' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#27C93F' }} />
                      </Box>
                      <Chip label="Consultant Workspace" size="small" sx={{ bgcolor: alpha('#7EC845', 0.1), color: '#5F9F2F', fontWeight: 600, border: '1px solid rgba(126,200,69,0.2)' }} />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Avatar src="https://i.pravatar.cc/100?img=33" sx={{ width: 56, height: 56, border: '2px solid #7EC845' }} />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>Candidate Shortlisting</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Automated Match Analysis</Typography>
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        {['Engineering', 'Finance', 'Tech'].map(s => <Chip key={s} label={s} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />)}
                      </Stack>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 3, p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Proprietary AI Match</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#7EC845' }}>94%</Typography>
                      </Box>
                      <Box sx={{ width: '100%', height: 6, bgcolor: alpha('#1B2A4A', 0.1), borderRadius: 3, mt: 1, overflow: 'hidden' }}>
                        <Box sx={{ width: '94%', height: '100%', bgcolor: '#7EC845' }} />
                      </Box>
                    </Box>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ── Stats Strip ───────────────────────────────────── */}
        <Box sx={{ py: 10, bgcolor: 'transparent' }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {statsData.map((stat) => (
                <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                  <Tooltip title="Verified Tumaini consultancy data" arrow>
                    <Box sx={{ textAlign: 'center', cursor: 'default' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, mb: 0.5, color: '#1B2A4A' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ── Features Section ──────────────────────────────── */}
        <Box sx={{ py: 15, bgcolor: '#F8FAFC' }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 10 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, letterSpacing: '-0.03em' }}>
                Strategic Recruitment Consultancy
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', fontWeight: 400 }}>
                We combine human consultancy expertise with cutting-edge AI to redefine the African talent landscape.
              </Typography>
            </Box>

            <Grid container spacing={5}>
              {features.map((f) => (
                <Grid size={{ xs: 12, md: 4 }} key={f.title}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      height: '100%', 
                      bgcolor: 'transparent',
                      p: 2,
                      textAlign: 'center'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: 3, 
                        bgcolor: '#fff', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 4,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                        color: 'primary.main'
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>{f.title}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {f.desc}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ── Featured Jobs ─────────────────────────────────── */}
        <Box sx={{ py: 15 }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.03em' }}>
                  Exclusive Roles
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Positions managed exclusively by Tumaini Consultancy.
                </Typography>
              </Box>
              <Button 
                variant="text" 
                endIcon={<ArrowForward />} 
                onClick={() => navigate('/jobs')}
                sx={{ fontWeight: 700, display: { xs: 'none', sm: 'flex' } }}
              >
                Browse All Vacancies
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
            ) : (
              <Grid container spacing={3}>
                {jobs.slice(0, 6).map((job) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={job.id}>
                    <Card 
                      variant="outlined"
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderRadius: 3,
                        transition: 'all 200ms ease',
                        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }
                      }}
                    >
                      <CardContent sx={{ flex: 1, p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>{job.title}</Typography>
                          <StarIcon sx={{ color: '#7EC845', fontSize: 20 }} />
                        </Box>
                        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <LocationOn sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{job.location}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <Business sx={{ fontSize: 16 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{job.sector}</Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {job.description}
                        </Typography>
                      </CardContent>
                      <Box sx={{ px: 3, pb: 3 }}>
                        <Tooltip title="View full mandate details and apply" arrow>
                          <Button fullWidth variant="contained" color="secondary" onClick={() => navigate('/jobs')} sx={{ borderRadius: 2, fontWeight: 700 }}>
                            Apply Now
                          </Button>
                        </Tooltip>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Container>
        </Box>

        {/* ── Final CTA ─────────────────────────────────────── */}
        <Box sx={{ py: 12, bgcolor: alpha('#7EC845', 0.05), textAlign: 'center' }}>
          <Container maxWidth="md">
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 3, letterSpacing: '-0.03em', color: '#1B2A4A' }}>
              Ready to Build Your Dream Team?
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mb: 6, fontWeight: 400 }}>
              Join forward-thinking companies already using AI to find the right talent.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: "center" }}>
              <Button 
                variant="contained" 
                size="large" 
                onClick={() => navigate('/register')}
                sx={{ px: 6, py: 2, borderRadius: 3, fontSize: '1.1rem', fontWeight: 800 }}
              >
                Join Our Talent Pool
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                onClick={() => navigate('/login')}
                sx={{ px: 6, py: 2, borderRadius: 3, fontSize: '1.1rem', fontWeight: 800 }}
              >
                Consultant Login
              </Button>
            </Stack>
          </Container>
        </Box>
      </Box>

      <AppFooter />
    </Box>
  );
};
