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
  IconButton,
  Divider,
  CircularProgress,
  Collapse,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { shortlistApi } from '../../api/matching';
import type { Shortlist } from '../../types';

export const ShortlistsPage: React.FC = () => {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchShortlists = async () => {
    try {
      const data = await shortlistApi.getShortlists();
      if (Array.isArray(data)) {
        setShortlists(data);
        if (data.length > 0 && !expandedId) {
          setExpandedId(data[0].id);
        }
      } else {
        setShortlists([]);
      }
    } catch { /* silent */ } finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchShortlists();
  }, []);

  const handleExport = async (id: string, format: 'pdf' | 'excel') => {
    setIsExporting(`${id}-${format}`);
    try {
      console.log(`Starting ${format} export for shortlist ${id}...`);
      const blob = await shortlistApi.exportShortlist(id, format);
      console.log('Export successful, creating download link...');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shortlist-${id}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { 
      console.error(`${format} export failed:`, err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleRemoveCandidate = async (shortlistId: string, candidateId: string) => {
    try {
      await shortlistApi.removeCandidate(shortlistId, candidateId);
      await fetchShortlists();
    } catch { /* silent */ }
  };

  const handleDeleteShortlist = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this shortlist?")) {
      try {
        await shortlistApi.deleteShortlist(id);
        await fetchShortlists();
      } catch { /* silent */ }
    }
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <Box sx={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>
          Candidate Shortlists
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and export your top talent selections.
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : shortlists.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 10 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${alpha('#7EC845', 0.1)}, ${alpha('#FF9A6C', 0.05)})` }}>
            <PeopleIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>No shortlists created yet</Typography>
          <Typography variant="body2" color="text.secondary">Run AI Matching or search for candidates to start shortlisting.</Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {shortlists.map((shortlist) => (
            <Card key={shortlist.id} variant="outlined" sx={{ borderColor: 'divider', '&:hover': { borderColor: 'primary.main' } }}>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={2} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{shortlist.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created {new Date(shortlist.created_at).toLocaleDateString()} • {shortlist.candidates.length} candidates
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: { md: 'flex-end' } }}>
                      <Tooltip title="Download as professionally styled PDF" arrow>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={isExporting === `${shortlist.id}-pdf` ? <CircularProgress size={16} /> : <DownloadIcon />} 
                          onClick={() => handleExport(shortlist.id, 'pdf')} 
                          disabled={!!isExporting}
                          sx={{ borderRadius: 2 }}
                        >
                          PDF
                        </Button>
                      </Tooltip>
                      <Tooltip title="Download as data-ready CSV" arrow>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={isExporting === `${shortlist.id}-excel` ? <CircularProgress size={16} /> : <DownloadIcon />} 
                          onClick={() => handleExport(shortlist.id, 'excel')} 
                          disabled={!!isExporting}
                          sx={{ borderRadius: 2 }}
                        >
                          Excel
                        </Button>
                      </Tooltip>
                      <Tooltip title={expandedId === shortlist.id ? "Hide candidates" : "View candidates"} arrow>
                        <IconButton onClick={() => toggleExpand(shortlist.id)} sx={{ borderRadius: 1.5 }}>
                          {expandedId === shortlist.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Shortlist" arrow>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteShortlist(shortlist.id)} 
                          sx={{ borderRadius: 1.5 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Grid>
                </Grid>

                <Collapse in={expandedId === shortlist.id} timeout="auto" unmountOnExit>
                  <Box sx={{ mt: 3 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1.5}>
                      {shortlist.candidates.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No candidates in this shortlist yet.
                        </Typography>
                      ) : (
                        shortlist.candidates.map((candidate) => (
                          <Box
                            key={candidate.candidate_id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 2,
                              borderRadius: 2,
                              bgcolor: alpha('#000', 0.02),
                              '&:hover': { bgcolor: alpha('#7EC845', 0.04) },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <PersonIcon color="action" />
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{candidate.name}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Chip label={`${Math.round(candidate.score)}% Match`} size="small" color="primary" variant="outlined" sx={{ borderRadius: 1.5 }} />
                                  {candidate.notes && (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>"{candidate.notes}"</Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            <Tooltip title="Remove from shortlist" arrow>
                              <IconButton 
                                size="small" 
                                color="error" 
                                sx={{ borderRadius: 1.5 }}
                                onClick={() => handleRemoveCandidate(shortlist.id, candidate.candidate_id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ))
                      )}
                    </Stack>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};
