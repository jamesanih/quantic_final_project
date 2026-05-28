import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Stack,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { cvApi } from '../../api/cv';
import type { CV } from '../../types';

const statusIcons: Record<string, React.ReactElement> = {
  PROCESSED: <CheckCircleIcon />,
  PROCESSING: <CircularProgress size={16} />,
  FAILED: <ErrorIcon />,
};
const statusLabels: Record<string, string> = {
  PROCESSED: 'Processed',
  PROCESSING: 'Processing',
  FAILED: 'Failed',
};
const statusColors: Record<string, 'success' | 'info' | 'error' | 'default'> = {
  PROCESSED: 'success',
  PROCESSING: 'info',
  FAILED: 'error',
};

export const CVManagement: React.FC = () => {
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCv, setSelectedCv] = useState<CV | null>(null);

  const fetchCVs = async () => {
    try {
      const data = await cvApi.getMyCVs();
      setCvs(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCVs(); }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploaded = await cvApi.bulkUpload(Array.from(files));
      setCvs(prev => [...uploaded, ...prev]);
    } catch {
      setUploadError('Bulk upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleViewDetails = (cv: CV) => {
    setSelectedCv(cv);
  };

  const handleDeleteCV = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this CV? This will also remove the candidate from semantic vector search.")) {
      try {
        await cvApi.deleteCV(id);
        setCvs(prev => prev.filter(c => c.id !== id));
      } catch {
        // silent
      }
    }
  };

  return (
    <Box sx={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
          CV Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload and manage your candidate database.
        </Typography>
      </Box>

      {/* ── Upload zone ───────────────────────────────────── */}
      <Card
        sx={{
          mb: 4,
          bgcolor: alpha('#7EC845', 0.04),
          border: `2px dashed ${alpha('#7EC845', 0.3)}`,
          borderRadius: 4,
          transition: 'all 200ms ease',
          '&:hover': {
            borderColor: alpha('#7EC845', 0.5),
            bgcolor: alpha('#7EC845', 0.06),
          },
        }}
      >
        <CardContent sx={{ py: 6, textAlign: 'center' }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              mx: 'auto',
              mb: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha('#7EC845', 0.1),
            }}
          >
            <UploadIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            Bulk CV Upload
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Drop multiple PDF CVs here or click to browse. Files will be parsed and indexed for semantic search.
          </Typography>
          <input
            accept="application/pdf"
            style={{ display: 'none' }}
            id="bulk-cv-upload"
            multiple
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="bulk-cv-upload">
            <Button
              variant="contained"
              component="span"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              size="large"
            >
              {isUploading ? 'Uploading & Parsing...' : 'Select Files'}
            </Button>
          </label>
          {uploadError && <Alert severity="error" sx={{ mt: 2, maxWidth: 400, mx: 'auto', borderRadius: 2 }}>{uploadError}</Alert>}
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Recent Uploads
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Candidate Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Uploaded</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cvs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">No CVs uploaded yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                cvs.map((cv) => {
                  const icon = statusIcons[cv.status];
                  const label = statusLabels[cv.status] || cv.status;
                  const color = statusColors[cv.status] || 'default';
                  return (
                    <TableRow key={cv.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DescriptionIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{cv.file_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{cv.extracted_data?.name || 'Pending...'}</TableCell>
                      <TableCell>
                        <Chip icon={icon} label={label} color={color} size="small" sx={{ borderRadius: 1.5 }} />
                      </TableCell>
                      <TableCell>{new Date(cv.uploaded_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                          <Button 
                            size="small" 
                            sx={{ borderRadius: 2 }}
                            onClick={() => handleViewDetails(cv)}
                          >
                            View Details
                          </Button>
                          <IconButton 
                            size="small" 
                            color="error" 
                            sx={{ borderRadius: 1.5 }}
                            onClick={() => handleDeleteCV(cv.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── CV Details Modal ─────────────────────────────────── */}
      <Dialog 
        open={!!selectedCv} 
        onClose={() => setSelectedCv(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 4 }
          }
        }}
      >
        {selectedCv && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>CV Details</Typography>
              <Typography variant="body2" color="text.secondary">{selectedCv.file_name}</Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Personal Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body1">{selectedCv.extracted_data?.name || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EmailIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body1">{selectedCv.extracted_data?.email || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PhoneIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body1">{selectedCv.extracted_data?.phone || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body1">{selectedCv.extracted_data?.location || 'N/A'}</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Skills
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                      {selectedCv.extracted_data?.skills?.map((skill, idx) => (
                        <Chip key={idx} label={skill} size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                      )) || <Typography variant="body2" color="text.secondary">No skills extracted.</Typography>}
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Experience
                    </Typography>
                    {selectedCv.extracted_data?.work_experiences?.map((exp, idx) => (
                      <Box key={idx} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <WorkIcon sx={{ mr: 1.5, mt: 0.5, color: 'text.secondary', fontSize: 18 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{exp.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{exp.company}</Typography>
                            <Typography variant="caption" color="text.secondary">{exp.start_date} - {exp.end_date || 'Present'}</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>{exp.description}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    )) || <Typography variant="body2" color="text.secondary">No experience extracted.</Typography>}
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Education
                    </Typography>
                    {selectedCv.extracted_data?.education?.map((edu, idx) => (
                      <Box key={idx} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <SchoolIcon sx={{ mr: 1.5, mt: 0.5, color: 'text.secondary', fontSize: 18 }} />
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{edu.qualification}</Typography>
                            <Typography variant="body2" color="text.secondary">{edu.institution} ({edu.year})</Typography>
                          </Box>
                        </Box>
                      </Box>
                    )) || <Typography variant="body2" color="text.secondary">No education extracted.</Typography>}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setSelectedCv(null)} variant="outlined" sx={{ borderRadius: 2 }}>Close</Button>
              <Button variant="contained" sx={{ borderRadius: 2 }}>Edit Details</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
