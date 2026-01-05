import { useCallback, useState } from 'react';
import {
  COLS,
  createEmptyBoard,
  ROWS,
  WINNING_LENGTH,
} from '../types';
import type {
  Board,
  CellValue,
  GameMode,
  GameScreen,
  GameState,
  Player,
  WinningLine,
} from '../types';

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
}

export function useConnect4(
  players: [Player, Player],
  gameMode: GameMode
): UseConnect4Return {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(),
    currentPlayer: 1,
    players,
    gameMode,
    screen: 'playing',
    winner: null,
    moveHistory: [],
    isDraw: false,
  }));

  const canDropInColumn = useCallback(
    (col: number): boolean => {
      if (gameState.winner || gameState.isDraw) return false;
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

      const newBoard = cloneBoard(gameState.board);
      newBoard[row][col] = gameState.currentPlayer;

      const winner = checkWinner(newBoard);
      const isDraw = !winner && isBoardFull(newBoard);

      setGameState((prev) => ({
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        winner,
        isDraw,
        moveHistory: [...prev.moveHistory, col],
        screen: winner || isDraw ? 'gameOver' : 'playing',
      }));

      return { row, col };
    },
    [canDropInColumn, gameState.board, gameState.currentPlayer, gameState.screen]
  );

  const resetGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      board: createEmptyBoard(),
      currentPlayer: 1,
      winner: null,
      isDraw: false,
      moveHistory: [],
      screen: 'playing',
    }));
  }, []);

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
    setGameState((prev) => ({
      ...prev,
      screen: 'menu',
    }));
  }, []);

  const setScreen = useCallback((screen: GameScreen) => {
    setGameState((prev) => ({
      ...prev,
      screen,
    }));
  }, []);

  const undoLastMove = useCallback(() => {
    if (gameState.moveHistory.length === 0) return;

    const newHistory = [...gameState.moveHistory];
    const lastCol = newHistory.pop()!;

    // Find the piece to remove (top-most piece in that column)
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
    }));
  }, [gameState.board, gameState.moveHistory]);

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
  };
}

// Export utility functions for testing
export const testUtils = {
  checkWinner,
  isBoardFull,
  getLowestEmptyRow,
  checkDirection,
};
