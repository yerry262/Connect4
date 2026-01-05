import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { GameBoard } from './GameBoard';
import { onlineManager } from '../utils/onlineManager';
import { OnlineGame as OnlineGameType } from '../types/online';
import { CellValue, Board, Player, DEFAULT_COLORS } from '../types';

interface OnlineGameProps {
  gameId: string;
  onExit: () => void;
}

export const OnlineGame: React.FC<OnlineGameProps> = ({ gameId, onExit }) => {
  const [game, setGame] = useState<OnlineGameType | undefined>(onlineManager.getGame(gameId));
  const [currentUser, setCurrentUser] = useState(onlineManager.getCurrentUser());

  useEffect(() => {
    const unsubscribe = onlineManager.subscribe(() => {
      setGame(onlineManager.getGame(gameId));
      setCurrentUser(onlineManager.getCurrentUser());
    });
    return unsubscribe;
  }, [gameId]);

  if (!game || !currentUser) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
        <Typography variant="h5" color="error">Game not found or disconnected</Typography>
        <Button onClick={onExit} variant="contained" sx={{ mt: 2 }}>Exit</Button>
      </Box>
    );
  }

  const isMyTurn = game.currentTurn === currentUser.id;
  const playerIndex = game.players.indexOf(currentUser.id); // 0 or 1
  
  // Construct Player objects
  const players: [Player, Player] = [
    { 
      id: 1, 
      name: onlineManager.getUser(game.players[0])?.username || 'Player 1', 
      color: DEFAULT_COLORS.player1[0], 
      isComputer: false 
    },
    { 
      id: 2, 
      name: onlineManager.getUser(game.players[1])?.username || 'Player 2', 
      color: DEFAULT_COLORS.player2[0], 
      isComputer: false 
    }
  ];

  const currentPlayer = players.find(p => 
    (p.id === 1 && game.currentTurn === game.players[0]) || 
    (p.id === 2 && game.currentTurn === game.players[1])
  ) || players[0];

  const handleColumnClick = (col: number) => {
    if (isMyTurn && game.status === 'active') {
      onlineManager.makeMove(gameId, col);
    }
  };

  // Convert online board (numbers) to GameBoard format (CellValue)
  const board: Board = game.board.map(row => 
    row.map(cell => {
      if (cell === 1) return 1; // Player 1
      if (cell === 2) return 2; // Player 2
      return null;
    })
  );

  const canDropInColumn = (col: number) => {
    return board[0][col] === null;
  };

  const opponentId = game.players.find(p => p !== currentUser.id);
  const opponent = onlineManager.getUser(opponentId || '');

  // Construct winner object if game is over
  const winner = game.winner ? {
    winner: game.winner === game.players[0] ? 1 : 2,
    line: [] // We don't have the line from the server yet, maybe add it later
  } : null;

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
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.1)', color: 'white', width: '100%', maxWidth: 600 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Vs {opponent ? opponent.username : 'Opponent'}
          </Typography>
          <Typography variant="h6" color={isMyTurn ? 'primary' : 'text.secondary'}>
            {game.status === 'completed' 
              ? (game.winner === currentUser.id ? 'YOU WON!' : game.winner ? 'YOU LOST' : 'DRAW')
              : (isMyTurn ? 'YOUR TURN' : 'THEIR TURN')}
          </Typography>
          <Button variant="outlined" color="inherit" onClick={onExit}>
            Exit
          </Button>
        </Box>
      </Paper>

      <GameBoard 
        board={board}
        players={players}
        currentPlayer={currentPlayer}
        winner={winner as any} // Cast because we are missing the line
        onColumnClick={handleColumnClick}
        canDropInColumn={canDropInColumn}
        lastMove={null} // We can implement this later
      />
    </Box>
  );
};
