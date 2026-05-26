import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
  CircularProgress,
  alpha,
} from '@mui/material';
import { Lock as LockIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { authApi } from '../../api/auth';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    setIsLoading(true);
    setError('');
    try {
      await authApi.resetPassword({ token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch {
      setError('Invalid or expired reset token. Please request a new one.');
    } finally {
      setIsLoading(false);
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
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box component="img" src="/logo.png" alt="Tumaini AI" sx={{ height: 56, mx: 'auto', mb: 2.5, display: 'block' }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Set New Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a strong password for your account
            </Typography>
          </Box>

          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                Password updated successfully! Redirecting to login...
              </Alert>
            </Box>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
              {!token && (
                <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                  No reset token found. Please use the link from your email.
                </Alert>
              )}
              <form onSubmit={handleSubmit}>
                <TextField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  helperText="Minimum 8 characters"
                  sx={{ mb: 2.5 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  error={confirmPassword !== '' && newPassword !== confirmPassword}
                  helperText={confirmPassword !== '' && newPassword !== confirmPassword ? 'Passwords do not match' : ''}
                  sx={{ mb: 3 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isLoading || !token || newPassword !== confirmPassword}
                  sx={{ py: 1.5 }}
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                </Button>
              </form>
            </>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}
            >
              <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Login
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
