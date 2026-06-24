import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Chip, Avatar, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Badge
} from '@mui/material';
import { 
  ExitToApp, EmojiEvents, SportsEsports, TrendingUp
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { GameBoard } from './GameBoard';
import { WinCelebration } from './WinCelebration';
import { onlineManager } from '../utils/onlineManager';
import type { OnlineGame as OnlineGameType, OnlineUser } from '../types/online';
import type { Board, Player } from '../types';
import { DEFAULT_COLORS } from '../types';

interface OnlineGameProps {
  gameId: string;
  onExit: () => void;
}

// Player card component for game header
const PlayerCard: React.FC<{ 
  user: OnlineUser; 
  isCurrentTurn: boolean; 
  isYou: boolean;
  playerColor: string;
}> = ({ user, isCurrentTurn, isYou, playerColor }) => {
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Grandmaster': return '#FFD700';
      case 'Master': return '#E040FB';
      case 'Diamond': return '#00BCD4';
      case 'Platinum': return '#78909C';
      case 'Gold': return '#FFC107';
      case 'Silver': return '#9E9E9E';
      default: return '#8D6E63';
    }
  };

  return (
    <motion.div
      animate={{ 
        scale: isCurrentTurn ? 1.05 : 1,
        boxShadow: isCurrentTurn ? `0 0 20px ${playerColor}` : 'none'
      }}
      transition={{ duration: 0.3 }}
    >
      <Paper 
        sx={{ 
          p: 2, 
          bgcolor: isCurrentTurn ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
          color: 'white',
          borderRadius: 2,
          border: isCurrentTurn ? `2px solid ${playerColor}` : '2px solid transparent',
          minWidth: 180
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: playerColor,
                  border: '2px solid #1a1a2e'
                }}
              />
            }
          >
            <Avatar sx={{ bgcolor: user.avatarColor, width: 45, height: 45 }}>
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {isYou ? 'You' : user.username.split('#')[0]}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Chip 
                label={user.stats.rank} 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: 10,
                  bgcolor: getRankColor(user.stats.rank),
                  color: 'white'
                }} 
              />
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {user.stats.score} pts
              </Typography>
            </Box>
          </Box>
        </Box>
        {isCurrentTurn && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Chip 
              label={isYou ? "YOUR TURN" : "THINKING..."} 
              size="small" 
              color="primary"
              sx={{ mt: 1, width: '100%' }}
            />
          </motion.div>
        )}
      </Paper>
    </motion.div>
  );
};

export const OnlineGame: React.FC<OnlineGameProps> = ({ gameId, onExit }) => {
  const [game, setGame] = useState<OnlineGameType | undefined>(onlineManager.getGame(gameId));
  const [currentUser, setCurrentUser] = useState(onlineManager.getCurrentUser());
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showGameOverDialog, setShowGameOverDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = onlineManager.subscribe(() => {
      const updatedGame = onlineManager.getGame(gameId);
      setGame(updatedGame);
      setCurrentUser(onlineManager.getCurrentUser());
      
      // Show game over dialog when game completes
      if (updatedGame?.status === 'completed' && !showGameOverDialog) {
        setShowGameOverDialog(true);
      }
    });
    return unsubscribe;
  }, [gameId, showGameOverDialog]);

  if (!game || !currentUser) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor="#1a1a2e">
        <Typography variant="h5" color="error">Game not found or disconnected</Typography>
        <Button onClick={onExit} variant="contained" sx={{ mt: 2 }}>Exit</Button>
      </Box>
    );
  }

  const isMyTurn = game.currentTurn === currentUser.id;
  
  const player1User = onlineManager.getUser(game.players[0]);
  const player2User = onlineManager.getUser(game.players[1]);
  
  if (!player1User || !player2User) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" bgcolor="#1a1a2e">
        <Typography variant="h5" color="error">Players not found</Typography>
        <Button onClick={onExit} variant="contained" sx={{ mt: 2 }}>Exit</Button>
      </Box>
    );
  }

  // Construct Player objects for GameBoard
  const players: [Player, Player] = [
    { 
      id: 1, 
      name: player1User.username, 
      color: DEFAULT_COLORS.player1[0], 
      isComputer: false 
    },
    { 
      id: 2, 
      name: player2User.username, 
      color: DEFAULT_COLORS.player2[0], 
      isComputer: false 
    }
  ];

  const currentPlayerNum: 1 | 2 = game.currentTurn === game.players[0] ? 1 : 2;

  const handleColumnClick = (col: number) => {
    if (isMyTurn && game.status === 'active') {
      onlineManager.makeMove(gameId, col);
    }
  };

  // Convert online board (numbers) to GameBoard format
  const board: Board = game.board.map(row => 
    row.map(cell => {
      if (cell === 1) return 1;
      if (cell === 2) return 2;
      return null;
    })
  );

  const canDropInColumn = (col: number) => {
    return board[0][col] === null && isMyTurn && game.status === 'active';
  };

  const opponentId = game.players.find(p => p !== currentUser.id);
  const opponent = onlineManager.getUser(opponentId || '');

  // Determine winner info
  const isWinner = game.winner === currentUser.id;
  const isLoser = game.winner && game.winner !== currentUser.id;
  const isDraw = game.status === 'completed' && game.winner === null;

  // Create winner object for GameBoard
  const winner = game.status === 'completed' && game.winner ? {
    winner: (game.winner === game.players[0] ? 1 : 2) as 1 | 2,
    cells: (game.winningLine || []).map(([row, col]) => ({ row, col }))
  } : null;

  const handleAbandon = () => {
    onlineManager.abandonGame(gameId);
    onExit();
  };

  // Get head to head stats
  const h2h = opponent ? onlineManager.getHeadToHead(opponent.id) : { wins: 0, losses: 0, draws: 0 };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        p: 2,
        bgcolor: '#1a1a2e',
        color: 'white'
      }}
    >
      {/* Game Header */}
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: 'rgba(255,255,255,0.05)', 
          color: 'white', 
          width: '100%', 
          maxWidth: 700,
          borderRadius: 3
        }}
      >
        {/* Player Cards */}
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <PlayerCard 
            user={player1User} 
            isCurrentTurn={game.currentTurn === game.players[0]}
            isYou={game.players[0] === currentUser.id}
            playerColor={DEFAULT_COLORS.player1[0]}
          />
          
          <Box textAlign="center">
            <Typography variant="h6" sx={{ mb: 1 }}>VS</Typography>
            <Chip 
              icon={<SportsEsports />}
              label={`Move ${game.moveCount + 1}`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
            />
            {game.status === 'active' && (
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  H2H: {h2h.wins}W - {h2h.losses}L - {h2h.draws}D
                </Typography>
              </Box>
            )}
          </Box>
          
          <PlayerCard 
            user={player2User} 
            isCurrentTurn={game.currentTurn === game.players[1]}
            isYou={game.players[1] === currentUser.id}
            playerColor={DEFAULT_COLORS.player2[0]}
          />
        </Box>

        {/* Turn indicator for mobile */}
        {game.status === 'active' && (
          <Box mt={2} textAlign="center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Typography variant="h6" color={isMyTurn ? 'primary' : 'text.secondary'}>
                {isMyTurn ? '🎯 Your Turn - Drop a piece!' : '⏳ Waiting for opponent...'}
              </Typography>
            </motion.div>
          </Box>
        )}

        {/* Game Over Status */}
        {game.status === 'completed' && (
          <Box mt={2} textAlign="center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              {isWinner && (
                <Typography variant="h4" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <EmojiEvents /> YOU WON! +100 pts
                </Typography>
              )}
              {isLoser && (
                <Typography variant="h4" color="error.main">
                  You Lost! -10 pts
                </Typography>
              )}
              {isDraw && (
                <Typography variant="h4" color="warning.main">
                  It's a Draw! +25 pts
                </Typography>
              )}
            </motion.div>
          </Box>
        )}
      </Paper>

      {/* Game Board */}
      <Box sx={{ position: 'relative' }}>
        {!isMyTurn && game.status === 'active' && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <LinearProgress color="secondary" />
          </Box>
        )}
        
        <GameBoard 
          board={board}
          players={players}
          currentPlayer={currentPlayerNum}
          winner={winner}
          onColumnClick={handleColumnClick}
          canDropInColumn={canDropInColumn}
          lastMove={null}
        />
      </Box>

      {/* Win Celebration */}
      <AnimatePresence>
        {isWinner && game.status === 'completed' && <WinCelebration />}
      </AnimatePresence>

      {/* Controls */}
      <Box mt={3} display="flex" gap={2}>
        {game.status === 'completed' ? (
          <Button 
            variant="contained" 
            size="large"
            onClick={onExit}
            startIcon={<ExitToApp />}
          >
            Back to Dashboard
          </Button>
        ) : (
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => setShowExitDialog(true)}
            startIcon={<ExitToApp />}
          >
            Leave Game
          </Button>
        )}
      </Box>

      {/* Exit Confirmation Dialog */}
      <Dialog 
        open={showExitDialog} 
        onClose={() => setShowExitDialog(false)}
        PaperProps={{ sx: { bgcolor: '#1a1a2e', color: 'white' } }}
      >
        <DialogTitle>Leave Game?</DialogTitle>
        <DialogContent>
          <Typography>
            If you leave now, you'll forfeit the game and it will count as a loss.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            -10 points will be deducted from your score.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitDialog(false)}>Stay</Button>
          <Button onClick={handleAbandon} color="error" variant="contained">
            Leave & Forfeit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Game Over Dialog */}
      <Dialog 
        open={showGameOverDialog && game.status === 'completed'} 
        onClose={() => { setShowGameOverDialog(false); onExit(); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1a2e', color: 'white', textAlign: 'center' } }}
      >
        <DialogTitle>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            {isWinner && <EmojiEvents sx={{ fontSize: 60, color: '#FFD700' }} />}
            {isLoser && <Typography variant="h2">😢</Typography>}
            {isDraw && <Typography variant="h2">🤝</Typography>}
          </motion.div>
        </DialogTitle>
        <DialogContent>
          {isWinner && (
            <>
              <Typography variant="h4" color="success.main" gutterBottom>
                Victory!
              </Typography>
              <Typography variant="h6">
                You defeated {opponent?.username}!
              </Typography>
              <Chip 
                icon={<TrendingUp />} 
                label="+100 points" 
                color="success" 
                sx={{ mt: 2 }}
              />
            </>
          )}
          {isLoser && (
            <>
              <Typography variant="h4" color="error.main" gutterBottom>
                Defeat
              </Typography>
              <Typography variant="h6">
                {opponent?.username} wins this round
              </Typography>
              <Chip 
                icon={<TrendingUp />} 
                label="-10 points" 
                color="error" 
                sx={{ mt: 2 }}
              />
            </>
          )}
          {isDraw && (
            <>
              <Typography variant="h4" color="warning.main" gutterBottom>
                Draw!
              </Typography>
              <Typography variant="h6">
                Well played! The board is full.
              </Typography>
              <Chip 
                icon={<TrendingUp />} 
                label="+25 points" 
                color="warning" 
                sx={{ mt: 2 }}
              />
            </>
          )}
          
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary">Game Stats</Typography>
            <Box display="flex" justifyContent="center" gap={2} mt={1}>
              <Chip label={`${game.moveCount} moves`} variant="outlined" />
              <Chip label={`Streak: ${currentUser.stats.winStreak}🔥`} variant="outlined" />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => { setShowGameOverDialog(false); onExit(); }}
          >
            Back to Dashboard
          </Button>
          {opponent && !opponent.friends?.includes(currentUser.id) && (
            <Button 
              variant="outlined"
              onClick={() => {
                onlineManager.sendChallenge(opponent.id, 'Rematch? 🎮');
                setShowGameOverDialog(false);
                onExit();
              }}
            >
              Challenge Again
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
