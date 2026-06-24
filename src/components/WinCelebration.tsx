import { motion } from 'framer-motion';
import { Typography, Box } from '@mui/material';
import { isLowPowerDevice, prefersReducedMotion } from '../utils/performance';

export function WinCelebration() {
  // On low-power / reduced-motion devices, show the banner statically instead
  // of looping a scale+rotate animation forever (which never idles the CPU).
  const staticDisplay = isLowPowerDevice() || prefersReducedMotion();

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        pointerEvents: 'none',
        width: '100%',
      }}
    >
      <motion.div
        initial={staticDisplay ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0, rotate: -10 }}
        animate={
          staticDisplay
            ? { scale: 1, opacity: 1 }
            : {
                scale: [1, 1.2, 1],
                opacity: 1,
                rotate: [0, 5, -5, 0],
              }
        }
        transition={
          staticDisplay
            ? { duration: 0.3 }
            : {
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse',
              }
        }
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', md: '8rem' },
            fontWeight: 900,
            background: 'linear-gradient(to bottom, #FFD700, #FFA500)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 69, 0, 0.3)',
            textAlign: 'center',
            fontFamily: '"Arial Black", sans-serif',
            letterSpacing: '0.05em',
            filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))',
          }}
        >
          CONNECT 4!!
        </Typography>
      </motion.div>
    </Box>
  );
}
