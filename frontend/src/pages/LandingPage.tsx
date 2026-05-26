import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Stack,
  Container, CircularProgress, alpha, Divider, Avatar,
  Tooltip,
} from '@mui/material';
import {
  Work as WorkIcon, People as PeopleIcon,
  Psychology as PsychologyIcon, TrendingUp as TrendingUpIcon,
  LocationOn, ArrowForward,
  AutoGraph as AutoGraphIcon, 
  Public as PublicIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jobApi } from '../api/jobs';
import type { Job } from '../types';
import { LandingNav } from '../components/layout/LandingNav';
import { AppFooter } from '../components/layout/AppFooter';

const statsData = [
  { icon: <WorkIcon sx={{ fontSize: 28 }} />, value: '1,200+', label: 'Positions Filled', color: '#7EC845' },
  { icon: <PeopleIcon sx={{ fontSize: 28 }} />, value: '15,000+', label: 'Elite Talent Pool', color: '#1B2A4A' },
  { icon: <PsychologyIcon sx={{ fontSize: 28 }} />, value: '98%', label: 'Consultancy Accuracy', color: '#CD6DBB' },
  { icon: <TrendingUpIcon sx={{ fontSize: 28 }} />, value: '45%', label: 'Faster Placements', color: '#00A8CC' },
];

const features = [
  { 
    icon: <PsychologyIcon sx={{ fontSize: 40 }} />, 
    title: 'Expert AI Screening', 
    desc: 'Our consultants use proprietary RAG-powered engines to screen and match candidate CVs with 98% accuracy, identifying high-potential talent.',
    gradient: 'linear-gradient(135deg, #7EC845 0%, #5F9F2F 100%)',
    shadow: 'rgba(126, 200, 69, 0.2)'
  },
  { 
    icon: <AutoGraphIcon sx={{ fontSize: 40 }} />, 
    title: 'Strategic Talent Mapping', 
    desc: 'We map the African tech landscape using intelligent market data, enabling you to build deep proactive pipelines before vacancies exist.',
    gradient: 'linear-gradient(135deg, #CD6DBB 0%, #983287 100%)',
    shadow: 'rgba(205, 109, 187, 0.2)'
  },
  { 
    icon: <PublicIcon sx={{ fontSize: 40 }} />, 
    title: 'Pan-African Reach', 
    desc: 'From Cape Town to Lagos, we provide compliant, cross-border recruitment and payroll solutions supercharged by advanced data tools.',
    gradient: 'linear-gradient(135deg, #1B2A4A 0%, #2D4A6F 100%)',
    shadow: 'rgba(27, 42, 74, 0.2)'
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
    <Box sx={{ bgcolor: '#ffffff', display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
      <LandingNav />
      
      <Box sx={{ flex: 1 }}>
        {/* ── Hero Section ──────────────────────────────────── */}
        <Box 
          sx={{
            pt: { xs: 18, md: 24 },
            pb: { xs: 12, md: 18 },
            bgcolor: '#F8FAFC',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid',
            borderColor: 'rgba(27, 42, 74, 0.05)',
          }}
        >
          {/* Animated Background Glowing Orbs */}
          <Box
            sx={{
              position: 'absolute',
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#7EC845', 0.08)} 0%, transparent 70%)`,
              top: '-10%',
              left: '-10%',
              animation: 'floatSlow 14s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 0,
              '@keyframes floatSlow': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '50%': { transform: 'translate(40px, 30px)' },
              }
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#CD6DBB', 0.07)} 0%, transparent 70%)`,
              bottom: '5%',
              right: '5%',
              animation: 'floatReverse 16s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 0,
              '@keyframes floatReverse': {
                '0%, 100%': { transform: 'translate(0, 0)' },
                '50%': { transform: 'translate(-30px, -40px)' },
              }
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={8} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 6.5 }}>
                <Box>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      fontWeight: 800, 
                      color: 'primary.main', 
                      letterSpacing: '0.2em', 
                      mb: 2.5, 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 0.8,
                      borderRadius: 10,
                      bgcolor: alpha('#7EC845', 0.08),
                      border: '1px solid rgba(126,200,69,0.15)'
                    }}
                  >
                    TUMAINI RECRUITMENT CONSULTANCY
                  </Typography>
                  <Typography 
                    variant="h1" 
                    sx={{ 
                      fontWeight: 900, 
                      fontSize: { xs: '2.8rem', md: '4.5rem' }, 
                      lineHeight: 1.08, 
                      mb: 3, 
                      letterSpacing: '-0.04em', 
                      color: '#1B2A4A' 
                    }}
                  >
                    AI-Powered<br />
                    <Box 
                      component="span" 
                      sx={{ 
                        color: 'primary.main',
                        display: 'inline-block'
                      }}
                    >
                      Talent Solutions
                    </Box>
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'text.secondary', 
                      mb: 5.5, 
                      maxWidth: 550, 
                      lineHeight: 1.65, 
                      fontWeight: 400,
                      fontSize: { xs: '1.05rem', md: '1.15rem' }
                    }}
                  >
                    We are Africa's premier recruitment consultancy, blending sophisticated AI 
                    with executive advisory to place top technical talent across the globe. Fast, fair, and data-driven.
                  </Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      onClick={() => navigate('/register')}
                      sx={{ 
                        px: 5, 
                        py: 2, 
                        borderRadius: 3, 
                        fontSize: '1rem', 
                        fontWeight: 700, 
                        boxShadow: '0 10px 30px rgba(126, 200, 69, 0.35)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 35px rgba(126, 200, 69, 0.45)',
                        }
                      }}
                    >
                      Apply for Roles
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large" 
                      onClick={() => navigate('/login')}
                      sx={{ 
                        px: 5, 
                        py: 2, 
                        borderRadius: 3, 
                        fontSize: '1rem', 
                        fontWeight: 700,
                        borderWidth: '2px',
                        borderColor: '#1B2A4A',
                        color: '#1B2A4A',
                        '&:hover': {
                          borderWidth: '2px',
                          bgcolor: alpha('#1B2A4A', 0.04),
                          borderColor: '#1B2A4A',
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      Partner with Us
                    </Button>
                  </Stack>
                </Box>
              </Grid>

              {/* RAG Preview SaaS Visual */}
              <Grid size={{ xs: 12, md: 5.5 }}>
                <Box 
                  sx={{ 
                    position: 'relative', 
                    display: { xs: 'none', md: 'block' },
                    animation: 'floatVisual 6s ease-in-out infinite',
                    '@keyframes floatVisual': {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-12px)' },
                    }
                  }}
                >
                  {/* Decorative background visual glow */}
                  <Box 
                    sx={{
                      position: 'absolute',
                      inset: -20,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, rgba(126,200,69,0.1) 0%, rgba(205,109,187,0.1) 100%)',
                      filter: 'blur(30px)',
                      zIndex: 0
                    }}
                  />
                  
                  <Card 
                    sx={{ 
                      borderRadius: 5, 
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      boxShadow: '0 40px 80px rgba(27, 42, 74, 0.08), 0 1px 3px rgba(0,0,0,0.01)',
                      p: 4,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                      <Box sx={{ display: 'flex', gap: 1.2 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF5F56', boxShadow: '0 0 6px rgba(255,95,86,0.3)' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFBD2E', boxShadow: '0 0 6px rgba(255,189,46,0.3)' }} />
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#27C93F', boxShadow: '0 0 6px rgba(39,201,63,0.3)' }} />
                      </Box>
                      <Chip 
                        label="AI Matching Workspace" 
                        size="small" 
                        sx={{ 
                          bgcolor: alpha('#7EC845', 0.1), 
                          color: '#5F9F2F', 
                          fontWeight: 700, 
                          border: '1px solid rgba(126,200,69,0.2)' 
                        }} 
                      />
                    </Box>

                    <Box sx={{ mb: 3.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar 
                          src="https://i.pravatar.cc/100?img=33" 
                          sx={{ 
                            width: 60, 
                            height: 60, 
                            border: '3px solid #7EC845',
                            boxShadow: '0 4px 10px rgba(126,200,69,0.2)' 
                          }} 
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1B2A4A', mb: 0.2 }}>Candidate Shortlisting</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7EC845', animation: 'pulse 1.5s infinite' }} />
                            RAG Semantic Match Engine
                          </Typography>
                          <style>{`
                            @keyframes pulse {
                              0% { opacity: 0.3; }
                              50% { opacity: 1; }
                              100% { opacity: 0.3; }
                            }
                          `}</style>
                        </Box>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Chip label="Lead Go Developer" size="small" variant="outlined" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, color: 'secondary.main', borderColor: alpha('#1B2A4A', 0.15) }} />
                        <Chip label="Johannesburg" size="small" sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600, bgcolor: 'rgba(27,42,74,0.05)', color: 'secondary.main' }} />
                      </Stack>
                    </Box>

                    <Divider sx={{ mb: 3.5, borderColor: 'rgba(27, 42, 74, 0.06)' }} />

                    <Box sx={{ bgcolor: alpha('#7EC845', 0.04), borderRadius: 4, p: 2.5, border: '1px solid rgba(126,200,69,0.1)' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1B2A4A' }}>Semantic Fit Index</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#5F9F2F' }}>94%</Typography>
                      </Box>
                      <Box sx={{ width: '100%', height: 8, bgcolor: alpha('#1B2A4A', 0.08), borderRadius: 4, overflow: 'hidden' }}>
                        <Box 
                          sx={{ 
                            width: '94%', 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #7EC845 0%, #98D36A 100%)',
                            borderRadius: 4
                          }} 
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.2, fontWeight: 500 }}>
                        Match verified based on structural experience and system alignment.
                      </Typography>
                    </Box>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* ── Stats Strip ───────────────────────────────────── */}
        <Box sx={{ py: 12, bgcolor: '#ffffff', position: 'relative' }}>
          <Container maxWidth="lg">
            <Grid container spacing={3.5}>
              {statsData.map((stat) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                  <Tooltip title="Verified Tumaini consultancy data" arrow>
                    <Card
                      elevation={0}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        bgcolor: '#F8FAFC',
                        border: '1px solid rgba(27, 42, 74, 0.04)',
                        borderRadius: 4,
                        cursor: 'default',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 12px 30px rgba(27, 42, 74, 0.05)',
                          borderColor: alpha(stat.color, 0.2),
                          bgcolor: alpha(stat.color, 0.02)
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          borderRadius: '50%', 
                          bgcolor: alpha(stat.color, 0.08), 
                          color: stat.color, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2.5
                        }}
                      >
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 900, mb: 0.5, color: '#1B2A4A', fontSize: '2.1rem' }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {stat.label}
                      </Typography>
                    </Card>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ── Features Section ──────────────────────────────── */}
        <Box sx={{ py: 16, bgcolor: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle grid pattern background */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.25,
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(27,42,74,0.06) 1px, transparent 0),
                radial-gradient(circle at 1px 1px, rgba(27,42,74,0.06) 1px, transparent 0)
              `,
              backgroundSize: '32px 32px',
              backgroundPosition: '0 0, 16px 16px',
              pointerEvents: 'none'
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ textAlign: 'center', mb: 10 }}>
              <Typography 
                variant="overline" 
                sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.15em', display: 'block', mb: 1.5 }}
              >
                OUR CAPABILITIES
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, letterSpacing: '-0.03em', color: '#1B2A4A' }}>
                Strategic Recruitment Overhaul
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', fontWeight: 400, lineHeight: 1.6 }}>
                Tumaini combines executive-level advisory with bleeding-edge RAG engines to redefine how companies scout and match elite African tech talent.
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {features.map((f) => (
                <Grid size={{ xs: 12, md: 4 }} key={f.title}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      height: '100%', 
                      bgcolor: '#ffffff',
                      p: 4,
                      textAlign: 'center',
                      borderRadius: 5,
                      border: '1px solid rgba(27, 42, 74, 0.05)',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 24px 48px -15px ${f.shadow}, 0 0 1px ${f.shadow}`,
                        borderColor: alpha(f.shadow, 0.3)
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 76, 
                        height: 76, 
                        borderRadius: 3.5, 
                        background: f.gradient, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 4,
                        boxShadow: `0 8px 24px ${f.shadow}`,
                        color: '#ffffff'
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#1B2A4A' }}>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '0.925rem' }}>
                      {f.desc}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ── Featured Jobs ─────────────────────────────────── */}
        <Box sx={{ py: 16, bgcolor: '#ffffff' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 8 }}>
              <Box>
                <Typography 
                  variant="overline" 
                  sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.15em', display: 'block', mb: 1.5 }}
                >
                  PREMIUM VACANCIES
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, mb: 1.5, letterSpacing: '-0.03em', color: '#1B2A4A' }}>
                  Exclusive Mandates
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                  High-impact positions managed exclusively by Tumaini AI.
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                endIcon={<ArrowForward />} 
                onClick={() => navigate('/jobs')}
                sx={{ 
                  fontWeight: 700, 
                  display: { xs: 'none', sm: 'flex' },
                  borderRadius: 2.5,
                  px: 3,
                  py: 1.2,
                  borderWidth: '1.5px',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderWidth: '1.5px',
                    bgcolor: alpha('#7EC845', 0.05),
                    transform: 'translateX(3px)'
                  }
                }}
              >
                Browse All Vacancies
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
            ) : (
              <Grid container spacing={3.5}>
                {jobs.slice(0, 6).map((job, i) => {
                  const ACCENTS = ['#7EC845', '#1B2A4A', '#7EC845', '#1B2A4A'];
                  const a = ACCENTS[i % ACCENTS.length];
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={job.id}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          borderRadius: 5, 
                          border: '1px solid', 
                          borderColor: 'divider', 
                          bgcolor: '#fff', 
                          transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)', 
                          '&:hover': { 
                            transform: 'translateY(-8px)', 
                            boxShadow: '0 24px 60px rgba(0,0,0,0.08)', 
                            borderColor: '#7EC845' 
                          } 
                        }}
                      >
                        <Box sx={{ height: 6, background: `linear-gradient(90deg, ${a}, ${alpha(a, 0.4)})` }} />
                        <CardContent sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <Avatar 
                              sx={{ 
                                width: 52, 
                                height: 52, 
                                bgcolor: alpha(a, 0.08), 
                                color: a, 
                                fontWeight: 900, 
                                fontSize: '1.1rem', 
                                border: `1px solid ${alpha(a, 0.1)}` 
                              }}
                            >
                              {(job.client_name || job.title)[0]}
                            </Avatar>
                            <Box>
                              {job.client_name && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: a, 
                                    fontWeight: 800, 
                                    display: 'block', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.02em' 
                                  }}
                                >
                                  {job.client_name}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                <LocationOn sx={{ fontSize: 15 }} />
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {job.location || 'Remote'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, color: '#1B2A4A', lineHeight: 1.3 }}>
                            {job.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 3, 
                              lineHeight: 1.8, 
                              display: '-webkit-box', 
                              WebkitLineClamp: 3, 
                              WebkitBoxOrient: 'vertical', 
                              overflow: 'hidden', 
                              fontSize: '0.9rem' 
                            }}
                          >
                            {job.description}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}>
                            <Chip 
                              label={job.sector} 
                              size="small" 
                              variant="outlined" 
                              sx={{ 
                                borderRadius: 1.5, 
                                fontSize: '0.7rem', 
                                fontWeight: 700, 
                                height: 26, 
                                borderColor: alpha(a, 0.3), 
                                color: a 
                              }} 
                            />
                            <Chip 
                              label="Exclusive" 
                              size="small" 
                              sx={{ 
                                borderRadius: 1.5, 
                                fontSize: '0.7rem', 
                                height: 26, 
                                bgcolor: alpha('#7EC845', 0.08), 
                                color: '#5F9F2F', 
                                fontWeight: 700 
                              }} 
                            />
                          </Stack>
                          
                          <Divider sx={{ mb: 3, opacity: 0.5 }} />
                          
                          <Box sx={{ mt: 'auto' }}>
                            <Button 
                              fullWidth 
                              variant="contained" 
                              endIcon={<ArrowForward />} 
                              onClick={() => navigate('/register')} 
                              sx={{ 
                                borderRadius: 3, 
                                py: 1.5, 
                                fontSize: '0.95rem', 
                                fontWeight: 800, 
                                bgcolor: a, 
                                '&:hover': { 
                                  bgcolor: alpha(a, 0.9), 
                                  boxShadow: `0 8px 20px ${alpha(a, 0.25)}` 
                                } 
                              }}
                            >
                              Sign Up to Apply
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Container>
        </Box>

        {/* ── Final CTA (Dark Mode Overlay) ────────────────── */}
        <Box sx={{ py: 12, bgcolor: '#ffffff' }}>
          <Container maxWidth="lg">
            <Box 
              sx={{ 
                p: { xs: 6, md: 10 }, 
                background: `
                  radial-gradient(ellipse 60% 40% at 80% 80%, ${alpha('#CD6DBB', 0.04)} 0%, transparent 60%),
                  radial-gradient(ellipse 40% 30% at 20% 20%, ${alpha('#7EC845', 0.05)} 0%, transparent 60%),
                  linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 100%)
                `, 
                borderRadius: 7, 
                color: '#1B2A4A', 
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 30px 60px -15px rgba(27, 42, 74, 0.08)',
                border: '1px solid rgba(27, 42, 74, 0.06)'
              }}
            >
              {/* Internal neon ambient glow orbs */}
              <Box
                sx={{
                  position: 'absolute',
                  width: 250,
                  height: 250,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha('#7EC845', 0.08)} 0%, transparent 70%)`,
                  top: '-10%',
                  right: '-5%',
                  pointerEvents: 'none'
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha('#CD6DBB', 0.06)} 0%, transparent 70%)`,
                  bottom: '-10%',
                  left: '-5%',
                  pointerEvents: 'none'
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography 
                  variant="overline" 
                  sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.2em', display: 'block', mb: 2 }}
                >
                  START BUILDING
                </Typography>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 900, 
                    mb: 3, 
                    letterSpacing: '-0.03em', 
                    fontSize: { xs: '2.2rem', md: '3.2rem' },
                    lineHeight: 1.15,
                    color: '#1B2A4A'
                  }}
                >
                  Ready to Build Your Dream Team?
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'text.secondary', 
                    mb: 6, 
                    fontWeight: 400, 
                    maxWidth: 600, 
                    mx: 'auto',
                    fontSize: '1.05rem',
                    lineHeight: 1.6
                  }}
                >
                  Partner with Africa's tech-native recruitment leaders. Connect with pre-vetted professionals through predictive AI matching.
                </Typography>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2.5} 
                  sx={{ justifyContent: "center", maxWidth: 450, mx: 'auto' }}
                >
                  <Button 
                    variant="contained" 
                    size="large" 
                    onClick={() => navigate('/register')}
                    sx={{ 
                      px: 5, 
                      py: 2.2, 
                      borderRadius: 3, 
                      fontSize: '1rem', 
                      fontWeight: 800,
                      boxShadow: '0 8px 25px rgba(126, 200, 69, 0.3)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 28px rgba(126, 200, 69, 0.45)',
                      }
                    }}
                  >
                    Join Our Talent Pool
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    onClick={() => navigate('/login')}
                    sx={{ 
                      px: 5, 
                      py: 2.2, 
                      borderRadius: 3, 
                      fontSize: '1rem', 
                      fontWeight: 800,
                      borderColor: 'secondary.main',
                      color: 'secondary.main',
                      borderWidth: '1.5px',
                      '&:hover': {
                        borderWidth: '1.5px',
                        borderColor: 'secondary.main',
                        bgcolor: alpha('#1B2A4A', 0.04),
                        transform: 'translateY(-2px)',
                      }
                    }}
                  >
                    Consultant Portal
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      <AppFooter />
    </Box>
  );
};
