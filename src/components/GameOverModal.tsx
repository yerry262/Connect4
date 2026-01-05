import { motion } from 'framer-motion';
import { Box, Button, Typography } from '@mui/material';
import { Celebration, Refresh, Home, SentimentDissatisfied } from '@mui/icons-material';
import type { Player } from '../types';
import Confetti from './Confetti';

interface GameOverModalProps {
  winner: Player | null;
  isDraw: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
}

export function GameOverModal({
  winner,
  isDraw,
  onPlayAgain,
  onExit,
}: GameOverModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      {winner && <Confetti />}

      <motion.div
        initial={{ scale: 0.5, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Box
          sx={{
            p: 6,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center',
            minWidth: 350,
          }}
        >
          {isDraw ? (
            <>
              <SentimentDissatisfied
                sx={{ fontSize: 80, color: '#FFC53D', mb: 2 }}
              />
              <Typography
                variant="h3"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                It's a Draw!
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}
              >
                The board is full. No one wins this time!
              </Typography>
            </>
          ) : winner ? (
            <>
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <Celebration
                  sx={{ fontSize: 80, color: winner.color, mb: 2 }}
                />
              </motion.div>
              <Typography
                variant="h3"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  mb: 1,
                }}
              >
                🎉 Winner! 🎉
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, ${winner.color}, ${winner.color}99)`,
                    boxShadow: `0 0 30px ${winner.color}`,
                  }}
                />
                <Typography
                  variant="h4"
                  sx={{
                    color: winner.color,
                    fontWeight: 700,
                    textShadow: `0 0 20px ${winner.color}`,
                  }}
                >
                  {winner.name}
                </Typography>
              </Box>
            </>
          ) : null}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                onClick={onPlayAgain}
                startIcon={<Refresh />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
                  boxShadow: '0 8px 25px rgba(78,205,196,0.3)',
                }}
              >
                Play Again
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                onClick={onExit}
                startIcon={<Home />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    background: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Menu
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>
    </motion.div>
  );
}
