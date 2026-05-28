import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  Paper,
  alpha,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  LocationOn as LocationOnIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/useAppStore';
import { cvApi } from '../../api/cv';
import type { CV } from '../../types';

export const CandidateProfile: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyCV = async () => {
      try {
        const cvs = await cvApi.getMyCVs();
        if (cvs.length > 0) {
          setCv(cvs[0]);
        }
      } catch (err) {
        console.error('Failed to fetch CV', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyCV();
  }, []);

  const [isDragging, setIsDragging] = useState(false);

  const processCVFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setError('Only PDF resumes are supported.');
        setIsUploading(false);
        return;
      }
      const uploadedCv = await cvApi.upload(file);
      setCv(uploadedCv);
    } catch (err) {
      setError('Failed to upload CV. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processCVFile(file);
    }
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processCVFile(file);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, letterSpacing: '-0.02em' }}>
        Your Profile
      </Typography>

      <Grid container spacing={4}>
        {/* ── Sidebar ──────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 3, textAlign: 'center', py: 4 }}>
            <Avatar
              sx={{
                width: 96,
                height: 96,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(255,107,53,0.3)',
              }}
            >
              {user?.full_name?.[0] || <PersonIcon />}
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {user?.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {user?.email}
            </Typography>
            <Chip
              label={user?.role}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ borderRadius: 1.5 }}
            />
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
                CV Status
              </Typography>
              
              {cv && (
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, p: 1.5, borderRadius: 2, bgcolor: alpha('#7EC845', 0.06), border: `1px solid ${alpha('#7EC845', 0.15)}` }}>
                    <DescriptionIcon color="primary" />
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{cv.file_name}</Typography>
                  </Box>
                  <Chip
                    label={cv.status}
                    color={cv.status === 'PROCESSED' ? 'success' : 'warning'}
                    size="small"
                    sx={{ borderRadius: 1.5, fontWeight: 700 }}
                  />
                </Box>
              )}

              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  p: 3,
                  border: '2px dashed',
                  borderColor: isDragging ? '#7EC845' : alpha('#1B2A4A', 0.15),
                  borderRadius: 3,
                  bgcolor: isDragging ? alpha('#7EC845', 0.06) : alpha('#1B2A4A', 0.02),
                  textAlign: 'center',
                  transition: 'all 200ms ease',
                  transform: isDragging ? 'scale(1.02)' : 'none',
                  boxShadow: isDragging ? '0 6px 20px rgba(126, 200, 69, 0.12)' : 'none',
                  '&:hover': {
                    borderColor: '#7EC845',
                    bgcolor: alpha('#7EC845', 0.02)
                  }
                }}
              >
                <UploadIcon sx={{ fontSize: 32, color: isDragging ? '#7EC845' : 'text.secondary', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {isDragging ? 'DROP TO UPLOAD!' : cv ? 'Update Resume Spec' : 'Upload Resume Spec'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, lineHeight: 1.3 }}>
                  {isDragging ? 'Release file now' : 'Drag & drop your PDF CV here or click to browse'}
                </Typography>
                <input
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  id="profile-cv-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <label htmlFor="profile-cv-upload">
                  <Button
                    variant="contained"
                    component="span"
                    size="small"
                    disabled={isUploading}
                    startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}
                  >
                    {isUploading ? 'Uploading...' : 'Browse Files'}
                  </Button>
                </label>
              </Box>

              {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Main content ─────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 8 }}>
          {!cv || cv.status !== 'PROCESSED' ? (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 4,
                bgcolor: alpha('#7EC845', 0.03),
                border: `1px dashed ${alpha('#7EC845', 0.25)}`,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  mx: 'auto',
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha('#7EC845', 0.1),
                }}
              >
                <WorkIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Upload your CV to see your AI-extracted profile
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Our AI will analyze your CV and extract your skills, experience, and education automatically.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {/* ── Extracted details ──────────────────────── */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700 }}>Personal Details</Typography>
                  <Grid container spacing={2}>
                    {[
                      { icon: <PersonIcon />, value: cv.extracted_data?.name },
                      { icon: <EmailIcon />, value: cv.extracted_data?.email },
                      { icon: <LocationOnIcon />, value: cv.extracted_data?.location },
                      { icon: <PhoneIcon />, value: cv.extracted_data?.phone },
                    ].map((item, i) => (
                      item.value && (
                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: alpha('#1B2A4A', 0.03) }}>
                            <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.value}</Typography>
                          </Box>
                        </Grid>
                      )
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* ── Skills ─────────────────────────────────── */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700 }}>Skills</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(cv?.extracted_data?.skills || []).map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ borderRadius: 1.5 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* ── Work experience ────────────────────────── */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700 }}>Work Experience</Typography>
                  <Stack spacing={2.5}>
                    {(cv?.extracted_data?.work_experiences || []).map((exp, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 0.5 }}>
                          <WorkIcon color="primary" sx={{ mt: 0.3 }} fontSize="small" />
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {exp.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {exp.company}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1, ml: 5 }}>
                          {exp.start_date} — {exp.end_date || 'Present'}
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 5, lineHeight: 1.7 }}>
                          {exp.description}
                        </Typography>
                        {index < cv.extracted_data!.work_experiences.length - 1 && (
                          <Divider sx={{ mt: 2, ml: 5 }} />
                        )}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {/* ── Education ──────────────────────────────── */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700 }}>Education</Typography>
                  <Stack spacing={2.5}>
                    {cv.extracted_data?.education.map((edu, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 0.5 }}>
                          <SchoolIcon color="secondary" sx={{ mt: 0.3 }} fontSize="small" />
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {edu.qualification} in {edu.field}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {edu.institution}, {edu.year}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
