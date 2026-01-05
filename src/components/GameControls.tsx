import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Pause,
  PlayArrow,
  Refresh,
  ExitToApp,
  Undo,
  Home,
  Stop,
} from '@mui/icons-material';
import { useState } from 'react';

interface GameControlsProps {
  isPaused: boolean;
  isGameOver: boolean;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onExit: () => void;
  onUndo: () => void;
  onEndGame: () => void;
  canUndo: boolean;
}

export function GameControls({
  isPaused,
  isGameOver,
  onPause,
  onResume,
  onReset,
  onExit,
  onUndo,
  onEndGame,
  canUndo,
}: GameControlsProps) {
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const buttonStyle = {
    minWidth: 50,
    minHeight: 50,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    '&:hover': {
      background: 'rgba(255,255,255,0.2)',
    },
    '&:disabled': {
      color: 'rgba(255,255,255,0.3)',
    },
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'center',
          flexWrap: 'wrap',
          mt: 3,
        }}
      >
        {/* Pause/Resume Button */}
        {!isGameOver && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <IconButton
              onClick={isPaused ? onResume : onPause}
              sx={buttonStyle}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <PlayArrow /> : <Pause />}
            </IconButton>
          </motion.div>
        )}

        {/* End Game Button */}
        {!isGameOver && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <IconButton
              onClick={onEndGame}
              sx={buttonStyle}
              title="End Game"
            >
              <Stop />
            </IconButton>
          </motion.div>
        )}

        {/* Undo Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <IconButton
            onClick={onUndo}
            disabled={!canUndo || isPaused}
            sx={buttonStyle}
            title="Undo"
          >
            <Undo />
          </IconButton>
        </motion.div>

        {/* Reset Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <IconButton
            onClick={() => setShowResetDialog(true)}
            sx={buttonStyle}
            title="Reset Game"
          >
            <Refresh />
          </IconButton>
        </motion.div>

        {/* Exit Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <IconButton
            onClick={() => setShowExitDialog(true)}
            sx={buttonStyle}
            title="Exit to Menu"
          >
            <Home />
          </IconButton>
        </motion.div>
      </Box>

      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && !isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
            onClick={onResume}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Box
                sx={{
                  p: 6,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'center',
                }}
              >
                <Pause sx={{ fontSize: 60, color: 'white', mb: 2 }} />
                <Typography
                  variant="h3"
                  sx={{ color: 'white', fontWeight: 700, mb: 3 }}
                >
                  PAUSED
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={onResume}
                    startIcon={<PlayArrow />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
                    }}
                  >
                    Resume
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      onResume();
                      setShowExitDialog(true);
                    }}
                    startIcon={<ExitToApp />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    Exit
                  </Button>
                </Box>
              </Box>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Dialog */}
      <Dialog
        open={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        PaperProps={{
          sx: {
            background: 'rgba(30,30,60,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Exit to Menu?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Are you sure you want to exit? Your current game progress will be lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowExitDialog(false)}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowExitDialog(false);
              onExit();
            }}
            variant="contained"
            color="error"
          >
            Exit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        PaperProps={{
          sx: {
            background: 'rgba(30,30,60,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Reset Game?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Are you sure you want to reset? The current game will start over.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowResetDialog(false)}
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowResetDialog(false);
              onReset();
            }}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            }}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
