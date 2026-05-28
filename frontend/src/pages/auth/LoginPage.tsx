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
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { login, fetchCurrentUser, clearError } from '../../store/slices/authSlice';


export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      await dispatch(fetchCurrentUser());
      const role = result.payload.role;
      navigate(role === 'CANDIDATE' ? '/candidate/dashboard' : '/recruiter/dashboard');
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
          maxWidth: 440,
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
          {/* ── Header ──────────────────────────────────── */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box component="img" src="/logo.png" alt="Tumaini AI" sx={{ height: 56, mx: 'auto', mb: 2.5, display: 'block' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your Tumaini AI portal
            </Typography>
          </Box>

          {/* ── Error alert ──────────────────────────────── */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* ── Form ─────────────────────────────────────── */}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2.5 }}
              data-testid="email"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 1 }}
              data-testid="password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              data-testid="login-submit"
              sx={{ mb: 3, py: 1.5 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>

          {/* ── Divider ───────────────────────────────────── */}
          <Box sx={{ position: 'relative', textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                bgcolor: 'divider',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: 'relative',
                display: 'inline-block',
                px: 2,
                bgcolor: 'background.paper',
                color: 'text.secondary',
              }}
            >
              New to Tumaini?
            </Typography>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            size="large"
            component={RouterLink}
            to="/register"
            sx={{ py: 1.5 }}
          >
            Create an Account
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};
