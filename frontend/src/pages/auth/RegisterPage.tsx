import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Work as WorkIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { register, clearError } from '../../store/slices/authSlice';
import type { Role } from '../../types';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('CANDIDATE');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    if (password !== confirmPassword) return;
    const result = await dispatch(register({ email, password, full_name: fullName, role }));
    if (register.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
        backgroundColor: '#F8FAFC',
      }}
    >
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{
          position: 'absolute',
          top: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 24 },
          zIndex: 10,
          fontWeight: 600,
          borderRadius: 2,
          px: { xs: 1.5, sm: 2.5 },
          py: { xs: 0.8, sm: 1 },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          color: 'text.primary',
          textTransform: 'none',
          '&:hover': {
            bgcolor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transform: 'translateY(-1px)'
          }
        }}
      >
        Back to Home
      </Button>
      {/* ── Animated gradient background ──────────────────── */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 20% 20%, ${alpha('#7EC845', 0.1)} 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 80%, ${alpha('#CD6DBB', 0.08)} 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 50% 50%, ${alpha('#6834A4', 0.05)} 0%, transparent 50%),
            linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)
          `,
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 12s ease infinite',
          zIndex: 0,
        }}
      />

      {/* ── Floating orbs ─────────────────────────────────── */}
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#7EC845', 0.06)} 0%, transparent 70%)`,
          top: '10%',
          left: '-5%',
          animation: 'float 8s ease-in-out infinite',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#CD6DBB', 0.06)} 0%, transparent 70%)`,
          bottom: '5%',
          right: '-3%',
          animation: 'float 10s ease-in-out infinite 2s',
          zIndex: 0,
        }}
      />

      {/* ── Card ──────────────────────────────────────────── */}
      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)',
          backdropFilter: 'blur(12px)',
          background: 'rgba(255,255,255,0.95)',
          animation: 'fadeInUp 0.5s ease-out',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box component="img" src="/logo.png" alt="Tumaini AI" sx={{ height: 56, mx: 'auto', mb: 2.5, display: 'block' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>Create Account</Typography>
            <Typography variant="body1" color="text.secondary">Join Tumaini AI Recruitment Platform</Typography>
          </Box>

          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Registration successful! Redirecting to login...</Alert>}
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required sx={{ mb: 2.5 }} data-testid="full-name" slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> } }} />
            <TextField label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2.5 }} data-testid="email" slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> } }} />
            <TextField select label="I am a..." value={role} onChange={(e) => setRole(e.target.value as Role)} sx={{ mb: 2.5 }} data-testid="role-select" slotProps={{ input: { startAdornment: <InputAdornment position="start"><WorkIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> } }}>
              <MenuItem value="CANDIDATE">Candidate — Looking for jobs</MenuItem>
              <MenuItem value="RECRUITER">Recruiter — Hiring talent</MenuItem>
            </TextField>
            <TextField label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 2.5 }} helperText="Minimum 8 characters" data-testid="password"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
                },
              }}
            />
            <TextField label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required error={confirmPassword !== '' && password !== confirmPassword} helperText={confirmPassword !== '' && password !== confirmPassword ? 'Passwords do not match' : ''} sx={{ mb: 3 }} data-testid="confirm-password" slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> } }} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={isLoading || password !== confirmPassword} data-testid="register-submit" sx={{ py: 1.5 }}>
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account? <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>Sign in</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
