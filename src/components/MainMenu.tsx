import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Button,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Dialog,
} from '@mui/material';
import { PlayArrow, Person, Computer, Public, Timer } from '@mui/icons-material';
import { DEFAULT_COLORS } from '../types';
import type { AIDifficulty, GameMode, Player } from '../types';
import { OnlineDashboard } from './OnlineDashboard';

interface MainMenuProps {
  onStartGame: (
    players: [Player, Player],
    gameMode: GameMode,
    aiDifficulty?: AIDifficulty,
    timerEnabled?: boolean,
    timePerTurn?: number
  ) => void;
  onStartOnlineGame?: (gameId: string) => void;
}

export function MainMenu({ onStartGame, onStartOnlineGame }: MainMenuProps) {
  const [gameMode, setGameMode] = useState<GameMode>('1v1');
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [player1Color, setPlayer1Color] = useState(DEFAULT_COLORS.player1[0]);
  const [player2Color, setPlayer2Color] = useState(DEFAULT_COLORS.player2[0]);
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>('medium');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timePerTurn, setTimePerTurn] = useState(30);
  const [showOnlineDashboard, setShowOnlineDashboard] = useState(false);

  const handleStartGame = () => {
    if (gameMode === 'online') {
      setShowOnlineDashboard(true);
      return;
    }

    const players: [Player, Player] = [
      { id: 1, name: player1Name, color: player1Color, isComputer: false },
      {
        id: 2,
        name: gameMode === '1vPC' ? `Computer (${aiDifficulty})` : player2Name,
        color: player2Color,
        isComputer: gameMode === '1vPC',
      },
    ];
    onStartGame(players, gameMode, gameMode === '1vPC' ? aiDifficulty : undefined, timerEnabled, timePerTurn);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Dialog 
        open={showOnlineDashboard} 
        onClose={() => setShowOnlineDashboard(false)}
        maxWidth="md"
        fullWidth
      >
        <OnlineDashboard 
          onStartGame={(gameId) => {
            setShowOnlineDashboard(false);
            onStartOnlineGame?.(gameId);
          }}
          onClose={() => setShowOnlineDashboard(false)}
        />
      </Dialog>

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '3rem', md: '5rem' },
            fontWeight: 900,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4, #45B7D1, #6C5CE7)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 4px 30px rgba(0,0,0,0.3)',
            mb: 1,
            letterSpacing: '-0.02em',
          }}
        >
          CONNECT 4
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            mb: 4,
            fontWeight: 300,
          }}
        >
          Drop, Connect, Win!
        </Typography>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)',
            maxWidth: 500,
            width: '100%',
          }}
        >
          {/* Game Mode Selection */}
          <Typography
            variant="subtitle1"
            sx={{ color: 'white', mb: 1, fontWeight: 600 }}
          >
            Game Mode
          </Typography>
          <ToggleButtonGroup
            value={gameMode}
            exclusive
            onChange={(_, value) => value && setGameMode(value)}
            sx={{
              width: '100%',
              mb: 3,
              '& .MuiToggleButton-root': {
                flex: 1,
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
                  color: 'white',
                },
              },
            }}
          >
            <ToggleButton value="1v1">
              <Person sx={{ mr: 1 }} /> 1 vs 1
            </ToggleButton>
            <ToggleButton value="1vPC">
              <Computer sx={{ mr: 1 }} /> vs Computer
            </ToggleButton>
            <ToggleButton value="online">
              <Public sx={{ mr: 1 }} /> Online PvP
            </ToggleButton>
          </ToggleButtonGroup>

          {gameMode === 'online' ? (
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                Play with friends or challenge others online!
              </Typography>
            </Box>
          ) : (
            <>
              {/* AI Difficulty Selection - only show for 1vPC mode */}
              {gameMode === '1vPC' && (
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel 
                  id="difficulty-label"
                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                >
                  Difficulty
                </InputLabel>
                <Select
                  labelId="difficulty-label"
                  value={aiDifficulty}
                  label="Difficulty"
                  onChange={(e) => setAIDifficulty(e.target.value as AIDifficulty)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6C5CE7',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'white',
                    },
                  }}
                >
                  <MenuItem value="easy">Easy - Random moves</MenuItem>
                  <MenuItem value="medium">Medium - Strategic</MenuItem>
                  <MenuItem value="hard">Hard - Expert AI</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Timer Settings */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  color="secondary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'white' }}>
                  <Timer sx={{ mr: 1 }} /> Timer per Turn
                </Box>
              }
            />
            {timerEnabled && (
              <Box sx={{ px: 2, mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {timePerTurn} seconds
                </Typography>
                <Slider
                  value={timePerTurn}
                  onChange={(_, value) => setTimePerTurn(value as number)}
                  min={5}
                  max={60}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ color: '#FF6B6B' }}
                />
              </Box>
            )}
          </Box>

          {/* Player 1 Setup */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ color: 'white', mb: 1, fontWeight: 600 }}
            >
              Player 1
            </Typography>
            <TextField
              fullWidth
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              placeholder="Enter name"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                  '&.Mui-focused fieldset': { borderColor: player1Color },
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {DEFAULT_COLORS.player1.map((color) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPlayer1Color(color)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: color,
                    border: player1Color === color ? '3px solid white' : '3px solid transparent',
                    cursor: 'pointer',
                    boxShadow: `0 4px 15px ${color}66`,
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Player 2 Setup */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{ color: 'white', mb: 1, fontWeight: 600 }}
            >
              {gameMode === '1vPC' ? 'Computer' : 'Player 2'}
            </Typography>
            {gameMode === '1v1' && (
              <TextField
                fullWidth
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                placeholder="Enter name"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                    '&.Mui-focused fieldset': { borderColor: player2Color },
                  },
                }}
              />
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {DEFAULT_COLORS.player2.map((color) => (
                <motion.button
                  key={color}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPlayer2Color(color)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: color,
                    border: player2Color === color ? '3px solid white' : '3px solid transparent',
                    cursor: 'pointer',
                    boxShadow: `0 4px 15px ${color}66`,
                  }}
                />
              ))}
            </Box>
          </Box>
          </>
          )}

          {/* Start Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleStartGame}
              startIcon={<PlayArrow />}
              sx={{
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                boxShadow: '0 8px 30px rgba(255,107,107,0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF8E53, #FF6B6B)',
                },
              }}
            >
              {gameMode === 'online' ? 'Open Dashboard' : 'Start Game'}
            </Button>
          </motion.div>
        </Paper>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.5)',
            mt: 4,
            textAlign: 'center',
          }}
        >
          Made with ❤️ | Connect 4 Classic
        </Typography>
      </motion.div>
    </Box>
  );
}
