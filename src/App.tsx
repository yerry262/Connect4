import { useState, useCallback } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import {
  AnimatedBackground,
  GameBoard,
  GameControls,
  GameOverModal,
  MainMenu,
  WinCelebration,
  OnlineGame,
} from './components';
import { useConnect4 } from './hooks';
import { DEFAULT_COLORS } from './types';
import type { AIDifficulty, GameMode, Player } from './types';

// Create a dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4ECDC4',
    },
    secondary: {
      main: '#FF6B6B',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

type AppScreen = 'menu' | 'game' | 'online-game';

function App() {
  const [appScreen, setAppScreen] = useState<AppScreen>('menu');
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null);
  const [players, setPlayers] = useState<[Player, Player]>([
    { id: 1, name: 'Player 1', color: DEFAULT_COLORS.player1[0], isComputer: false },
    { id: 2, name: 'Player 2', color: DEFAULT_COLORS.player2[0], isComputer: false },
  ]);
  const [gameMode, setGameMode] = useState<GameMode>('1v1');
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>('medium');
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timePerTurn, setTimePerTurn] = useState(30);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);

  const {
    gameState,
    dropPiece,
    resetGame,
    pauseGame,
    resumeGame,
    exitToMenu,
    canDropInColumn,
    undoLastMove,
    endGame,
    isAITurn,
  } = useConnect4(players, gameMode, aiDifficulty, timerEnabled, timePerTurn);

  const handleStartGame = useCallback(
    (newPlayers: [Player, Player], newGameMode: GameMode, newAIDifficulty?: AIDifficulty, newTimerEnabled?: boolean, newTimePerTurn?: number) => {
      setPlayers(newPlayers);
      setGameMode(newGameMode);
      if (newAIDifficulty) {
        setAIDifficulty(newAIDifficulty);
      }
      if (newTimerEnabled !== undefined) setTimerEnabled(newTimerEnabled);
      if (newTimePerTurn !== undefined) setTimePerTurn(newTimePerTurn);

      setAppScreen('game');
      setLastMove(null);
      resetGame();
    },
    [resetGame]
  );

  const handleStartOnlineGame = useCallback((gameId: string) => {
    setOnlineGameId(gameId);
    setAppScreen('online-game');
  }, []);

  const handleColumnClick = useCallback(
    (col: number) => {
      // Prevent player from clicking during AI turn
      if (isAITurn) return;
      const result = dropPiece(col);
      if (result) {
        setLastMove(result);
      }
    },
    [dropPiece, isAITurn]
  );

  const handleExit = useCallback(() => {
    setAppScreen('menu');
    exitToMenu();
    setLastMove(null);
  }, [exitToMenu]);

  const handleReset = useCallback(() => {
    resetGame();
    setLastMove(null);
  }, [resetGame]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setLastMove(null);
  }, [resetGame]);

  const handleEndGame = useCallback(() => {
    endGame();
  }, [endGame]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AnimatedBackground />

      {appScreen === 'menu' && (
        <MainMenu 
          onStartGame={handleStartGame} 
          onStartOnlineGame={handleStartOnlineGame}
        />
      )}

      {appScreen === 'online-game' && onlineGameId && (
        <OnlineGame 
          gameId={onlineGameId} 
          onExit={() => setAppScreen('menu')} 
        />
      )}

      {appScreen === 'game' && (
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
          <GameBoard
            board={gameState.board}
            players={players}
            currentPlayer={gameState.currentPlayer}
            winner={gameState.winner}
            onColumnClick={handleColumnClick}
            canDropInColumn={canDropInColumn}
            lastMove={lastMove}
          />

          {gameState.winner && <WinCelebration />}

          <GameControls
            isPaused={gameState.screen === 'paused'}
            isGameOver={gameState.screen === 'gameOver'}
            onPause={pauseGame}
            onResume={resumeGame}
            onReset={handleReset}
            onExit={handleExit}
            onUndo={undoLastMove}
            onEndGame={handleEndGame}
            canUndo={gameState.moveHistory.length > 0}
          />

          {gameState.screen === 'gameOver' && (
            <GameOverModal
              winner={
                gameState.winner
                  ? players[gameState.winner.winner - 1]
                  : null
              }
              isDraw={gameState.isDraw}
              onPlayAgain={handlePlayAgain}
              onExit={handleExit}
            />
          )}
        </Box>
      )}
    </ThemeProvider>
  );
}

export default App;
