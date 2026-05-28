import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
  alpha,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  ListAlt as ListAltIcon,
  Psychology as PsychologyIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  NotificationsNone as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppStore';
import { logout } from '../../store/slices/authSlice';
import { shortlistApi } from '../../api/matching';


const DRAWER_WIDTH = 270;

const candidateMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/candidate/dashboard' },
  { text: 'My Profile', icon: <PersonIcon />, path: '/candidate/profile' },
  { text: 'Browse Jobs', icon: <WorkIcon />, path: '/candidate/jobs' },
  { text: 'My Applications', icon: <ListAltIcon />, path: '/candidate/applications' },
];

const recruiterMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/recruiter/dashboard' },
  { text: 'Job Management', icon: <WorkIcon />, path: '/recruiter/jobs' },
  { text: 'AI Chat', icon: <PsychologyIcon />, path: '/recruiter/chat' },
  { text: 'Talent Discovery', icon: <SearchIcon />, path: '/recruiter/search' },
  { text: 'Shortlists', icon: <PeopleIcon />, path: '/recruiter/shortlists' },
  { text: 'CV Management', icon: <DescriptionIcon />, path: '/recruiter/cvs' },
];

export const AppLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [shortlistCount, setShortlistCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.role === 'RECRUITER' || user?.role === 'ADMIN') {
      const fetchShortlistCount = async () => {
        try {
          const lists = await shortlistApi.getShortlists();
          if (Array.isArray(lists)) {
            const total = lists.reduce((acc, list) => acc + (list.candidates?.length || 0), 0);
            setShortlistCount(total);
          } else {
            setShortlistCount(0);
          }
        } catch (err) { 
          console.error('Failed to fetch shortlist count:', err);
        }
      };
      fetchShortlistCount();
      const interval = setInterval(fetchShortlistCount, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [user]);

  const isRecruiter = user?.role === 'RECRUITER' || user?.role === 'ADMIN';
  const menuItems = isRecruiter ? recruiterMenuItems : candidateMenuItems;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const userInitial = (user?.full_name || user?.email || 'U')[0].toUpperCase();
  const userDisplayName = user?.full_name || user?.email || 'User';

  const currentItem = menuItems.find(item => item.path === location.pathname);

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          py: 2.5,
          px: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          background: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Box component="img" src="/logo.png" alt="Tumaini AI" sx={{ height: 42, display: 'block' }} />
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ ml: 'auto', color: 'text.secondary' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Box
        sx={{
          mx: 1.5,
          mt: 2,
          mb: 1,
          p: 2,
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 42, height: 42, bgcolor: theme.palette.primary.main, fontWeight: 700, fontSize: '1rem' }}>
            {userInitial}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
              {userDisplayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {isRecruiter ? 'Recruiter' : 'Candidate'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2 }} />

      <List sx={{ px: 1, pt: 1.5, flex: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isShortlists = item.path === '/recruiter/shortlists';
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2.5,
                  mb: 0.5,
                  py: 1.3,
                  px: 2,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': isActive ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: '55%',
                    borderRadius: '0 3px 3px 0',
                    background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                  } : undefined,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.14) },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'primary.main' : 'text.secondary' }}>
                  {isShortlists ? (
                    <Badge badgeContent={shortlistCount} color="primary" showZero sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 18, minWidth: 18 } }}>
                      {item.icon}
                    </Badge>
                  ) : item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: isActive ? 700 : 500 } } }}
                />
                {isActive && (
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ px: 1.5, pb: 2 }}>
        <Divider sx={{ mb: 1.5 }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2.5,
              py: 1.3,
              px: 2,
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                color: theme.palette.error.main,
                '& .MuiListItemIcon-root': { color: theme.palette.error.main },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              slotProps={{ primary: { sx: { fontSize: '0.875rem', fontWeight: 500 } } }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <CssBaseline />

      <Box sx={{ display: 'flex', flex: 1 }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { md: `${DRAWER_WIDTH}px` },
            backgroundColor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ display: { md: 'none' }, borderRadius: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700, flexGrow: 1 }}>
              {currentItem?.text || 'Tumaini AI'}
            </Typography>
            <Tooltip title="View Notifications" arrow>
              <IconButton sx={{ borderRadius: 2, color: 'text.secondary' }}>
                <Badge color="primary" variant="dot" invisible>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isMobile && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {userDisplayName}
                </Typography>
              )}
              <Tooltip title="Account Settings & Profile" arrow>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 38,
                      height: 38,
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {userInitial}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 8,
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 3,
                    overflow: 'visible',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      borderLeft: '1px solid',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    },
                  },
                },
              }}
            >
              <MenuItem
                onClick={() => { setAnchorEl(null); navigate(isRecruiter ? '/recruiter/dashboard' : '/candidate/profile'); }}
                sx={{ borderRadius: 1.5, mx: 0.5, gap: 1.5 }}
              >
                <PersonIcon fontSize="small" /> Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ borderRadius: 1.5, mx: 0.5, gap: 1.5, color: 'error.main' }}>
                <LogoutIcon fontSize="small" /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, backgroundImage: 'none' } }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, backgroundImage: 'none', borderRight: '1px solid', borderColor: 'divider' } }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: '64px', backgroundColor: 'background.default', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
