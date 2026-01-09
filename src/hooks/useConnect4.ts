import { useCallback, useState, useEffect, useRef } from 'react';
import {
  COLS,
  ROWS,
  WINNING_LENGTH,
  createInitialState,
} from '../types';
import type {
  AIDifficulty,
  Board,
  CellValue,
  GameMode,
  GameScreen,
  GameState,
  Player,
  WinningLine,
} from '../types';
import { getAIMove } from '../utils/ai';
import { storageManager } from '../utils/storageManager';

// Check for a win starting from a specific cell
function checkDirection(
  board: Board,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  player: CellValue
): Array<{ row: number; col: number }> | null {
  const cells: Array<{ row: number; col: number }> = [];

  for (let i = 0; i < WINNING_LENGTH; i++) {
    const r = row + i * dRow;
    const c = col + i * dCol;

    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    if (board[r][c] !== player) return null;

    cells.push({ row: r, col: c });
  }

  return cells;
}

// Check all directions for a win
function checkWinner(board: Board): WinningLine | null {
  const directions = [
    { dRow: 0, dCol: 1 }, // Horizontal
    { dRow: 1, dCol: 0 }, // Vertical
    { dRow: 1, dCol: 1 }, // Diagonal down-right
    { dRow: 1, dCol: -1 }, // Diagonal down-left
  ];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];
      if (cell === null) continue;

      for (const { dRow, dCol } of directions) {
        const cells = checkDirection(board, row, col, dRow, dCol, cell);
        if (cells) {
          return { cells, winner: cell };
        }
      }
    }
  }

  return null;
}

// Check if board is full (draw)
function isBoardFull(board: Board): boolean {
  return board[0].every((cell) => cell !== null);
}

// Find the lowest empty row in a column (gravity)
function getLowestEmptyRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return -1; // Column is full
}

// Clone the board for immutable updates
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export interface UseConnect4Return {
  gameState: GameState;
  dropPiece: (col: number) => { row: number; col: number } | null;
  resetGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  exitToMenu: () => void;
  setScreen: (screen: GameScreen) => void;
  canDropInColumn: (col: number) => boolean;
  undoLastMove: () => void;
  endGame: () => void;
  isAITurn: boolean;
}

export function useConnect4(
  players: [Player, Player],
  gameMode: GameMode,
  aiDifficulty: AIDifficulty = 'medium',
  timerEnabled: boolean = false,
  timePerTurn: number = 30
): UseConnect4Return {
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedState = storageManager.loadGameState();
    if (savedState) {
      if (savedState.board && savedState.players) {
        return savedState;
      }
    }
    return createInitialState(players, gameMode, timerEnabled, timePerTurn);
  });

  const aiMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingMove = useRef(false);

  useEffect(() => {
    if (gameState.screen === 'playing' || gameState.screen === 'paused') {
      storageManager.saveGameState(gameState);
    } else if (gameState.screen === 'gameOver' || gameState.screen === 'menu') {
      storageManager.clearGameState();
    }
  }, [gameState]);

  useEffect(() => {
    if (!gameState.timerEnabled || gameState.screen !== 'playing' || gameState.winner || gameState.isDraw || isProcessingMove.current) {
      return;
    }

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 0) {
          const winnerId = prev.currentPlayer === 1 ? 2 : 1;
          const newState = {
            ...prev,
            winner: { cells: [], winner: winnerId as 1 | 2 },
            screen: 'gameOver' as GameScreen,
          };
          storageManager.updateStats(winnerId as 1 | 2);
          return newState;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.timerEnabled, gameState.screen, gameState.winner, gameState.isDraw, gameState.currentPlayer]);

  const isAITurn = gameMode === '1vPC' &&
    gameState.currentPlayer === 2 &&
    players[1].isComputer &&
    gameState.screen === 'playing' &&
    !gameState.winner &&
    !gameState.isDraw &&
    !isProcessingMove.current;

  const canDropInColumn = useCallback(
    (col: number): boolean => {
      if (gameState.winner || gameState.isDraw || isProcessingMove.current) return false;
      return gameState.board[0][col] === null;
    },
    [gameState.board, gameState.winner, gameState.isDraw]
  );

  const dropPiece = useCallback(
    (col: number): { row: number; col: number } | null => {
      if (!canDropInColumn(col)) return null;
      if (gameState.screen !== 'playing') return null;

      const row = getLowestEmptyRow(gameState.board, col);
      if (row === -1) return null;

      isProcessingMove.current = true;

      const newBoard = cloneBoard(gameState.board);
      newBoard[row][col] = gameState.currentPlayer;

      const winner = checkWinner(newBoard);
      const isDraw = !winner && isBoardFull(newBoard);

      if (winner || isDraw) {
        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          moveHistory: [...prev.moveHistory, col],
          winner,
          isDraw,
        }));

        setTimeout(() => {
          setGameState((prev) => {
             const newState = {
              ...prev,
              screen: 'gameOver' as GameScreen,
            };
            if (winner) {
                storageManager.updateStats(winner.winner);
            } else if (isDraw) {
                storageManager.updateStats(null);
            }
            return newState;
          });
          isProcessingMove.current = false;
        }, 2000);
      } else {
        setGameState((prev) => ({
            ...prev,
            board: newBoard,
            moveHistory: [...prev.moveHistory, col],
            currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
            timeLeft: prev.timePerTurn,
        }));
        isProcessingMove.current = false;
      }

      return { row, col };
    },
    [canDropInColumn, gameState.board, gameState.currentPlayer, gameState.screen]
  );

  const resetGame = useCallback(() => {
    storageManager.clearGameState();
    setGameState(createInitialState(players, gameMode, timerEnabled, timePerTurn));
    isProcessingMove.current = false;
  }, [players, gameMode, timerEnabled, timePerTurn]);

  const pauseGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      screen: 'paused',
    }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      screen: 'playing',
    }));
  }, []);

  const exitToMenu = useCallback(() => {
    storageManager.clearGameState();
    setGameState((prev) => ({
      ...prev,
      screen: 'menu',
    }));
  }, []);

  const endGame = useCallback(() => {
      setGameState(prev => {
          const newState = {
              ...prev,
              screen: 'gameOver' as GameScreen,
              isDraw: true, 
          };
          storageManager.clearGameState();
          return newState;
      });
  }, []);

  const setScreen = useCallback((screen: GameScreen) => {
    setGameState((prev) => ({
      ...prev,
      screen,
    }));
  }, []);

  const undoLastMove = useCallback(() => {
    if (gameState.moveHistory.length === 0 || isProcessingMove.current) return;

    const newHistory = [...gameState.moveHistory];
    const lastCol = newHistory.pop()!;

    const newBoard = cloneBoard(gameState.board);
    for (let row = 0; row < ROWS; row++) {
      if (newBoard[row][lastCol] !== null) {
        newBoard[row][lastCol] = null;
        break;
      }
    }

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      winner: null,
      isDraw: false,
      moveHistory: newHistory,
      screen: 'playing',
      timeLeft: prev.timePerTurn,
    }));
  }, [gameState.board, gameState.moveHistory]);

  useEffect(() => {
    if (isAITurn) {
      const delay = aiDifficulty === 'hard' ? 800 : aiDifficulty === 'medium' ? 500 : 300;
      
      aiMoveTimeoutRef.current = setTimeout(() => {
        const aiCol = getAIMove(gameState.board, 2, aiDifficulty);
        if (aiCol !== -1) {
          const row = getLowestEmptyRow(gameState.board, aiCol);
          if (row !== -1) {
            isProcessingMove.current = true;
            const newBoard = cloneBoard(gameState.board);
            newBoard[row][aiCol] = 2;
            
            const winner = checkWinner(newBoard);
            const isDraw = !winner && isBoardFull(newBoard);
            
            if (winner || isDraw) {
                setGameState((prev) => ({
                  ...prev,
                  board: newBoard,
                  moveHistory: [...prev.moveHistory, aiCol],
                  winner,
                  isDraw,
                }));

                setTimeout(() => {
                    setGameState(prev => {
                        const newState = {
                            ...prev,
                            screen: 'gameOver' as GameScreen
                        };
                        if (winner) storageManager.updateStats(winner.winner);
                        else if (isDraw) storageManager.updateStats(null);
                        return newState;
                    });
                    isProcessingMove.current = false;
                }, 2000);
            } else {
                setGameState(prev => ({
                    ...prev,
                    board: newBoard,
                    moveHistory: [...prev.moveHistory, aiCol],
                    currentPlayer: 1,
                    timeLeft: prev.timePerTurn
                }));
                isProcessingMove.current = false;
            }
          }
        }
      }, delay);
    }

    return () => {
      if (aiMoveTimeoutRef.current) {
        clearTimeout(aiMoveTimeoutRef.current);
      }
    };
  }, [isAITurn, gameState.board, aiDifficulty]);

  return {
    gameState,
    dropPiece,
    resetGame,
    pauseGame,
    resumeGame,
    exitToMenu,
    setScreen,
    canDropInColumn,
    undoLastMove,
    endGame,
    isAITurn,
  };
}

// Export utility functions for testing
export const testUtils = {
  checkWinner,
  isBoardFull,
  getLowestEmptyRow,
  checkDirection,
};
