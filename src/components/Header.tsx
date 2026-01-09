import { Box, Chip, Avatar, Tooltip, IconButton } from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { onlineManager } from '../utils/onlineManager';
import { useState, useEffect } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export function Header({ onMenuClick, showMenu = false }: HeaderProps) {
  const currentUser = onlineManager.getCurrentUser();
  const [username, setUsername] = useState(currentUser?.username || 'Guest');
  const [avatarColor, setAvatarColor] = useState(currentUser?.avatarColor || '#4ECDC4');

  // Subscribe to user updates
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe(() => {
      const user = onlineManager.getCurrentUser();
      if (user) {
        setUsername(user.username);
        setAvatarColor(user.avatarColor);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: { xs: 56, md: 64 },
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, md: 3 },
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Left side - Menu button (if applicable) */}
      <Box sx={{ flex: 1 }}>
        {showMenu && onMenuClick && (
          <IconButton
            onClick={onMenuClick}
            sx={{
              color: 'white',
              '&:hover': {
                background: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      {/* Center - Logo/Title */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            fontWeight: 900,
            background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4, #45B7D1)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '0.05em',
          }}
        >
          CONNECT 4
        </Box>
      </Box>

      {/* Right side - User Profile */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Tooltip title="Your Profile">
          <Chip
            avatar={
              <Avatar sx={{ bgcolor: avatarColor, width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 } }}>
                {username.charAt(0).toUpperCase()}
              </Avatar>
            }
            label={
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                {username}
              </Box>
            }
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              height: { xs: 36, md: 40 },
              fontSize: { xs: '0.8rem', md: '0.9rem' },
              '& .MuiChip-avatar': {
                width: { xs: 28, md: 32 },
                height: { xs: 28, md: 32 },
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.15)',
              },
            }}
          />
        </Tooltip>
      </Box>
    </Box>
  );
}
