// Game Types and Constants for Connect4

export const ROWS = 6;
export const COLS = 7;
export const WINNING_LENGTH = 4;

export type CellValue = null | 1 | 2;
export type Board = CellValue[][];
export type GameMode = '1v1' | '1vPC';
export type GameScreen = 'menu' | 'playing' | 'paused' | 'gameOver';

export interface Player {
  id: 1 | 2;
  name: string;
  color: string;
  isComputer: boolean;
}

export interface WinningLine {
  cells: Array<{ row: number; col: number }>;
  winner: 1 | 2;
}

export interface GameState {
  board: Board;
  currentPlayer: 1 | 2;
  players: [Player, Player];
  gameMode: GameMode;
  screen: GameScreen;
  winner: WinningLine | null;
  moveHistory: number[];
  isDraw: boolean;
}

export const DEFAULT_COLORS = {
  player1: ['#FF6B6B', '#FF8E53', '#FFC53D', '#FF69B4', '#E91E63'],
  player2: ['#4ECDC4', '#45B7D1', '#6C5CE7', '#A29BFE', '#00CEC9'],
};

export const BOARD_COLORS = {
  primary: '#1E3A8A',
  secondary: '#2563EB',
  accent: '#3B82F6',
  slot: '#1E293B',
};

export function createEmptyBoard(): Board {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(null));
}

export function createInitialState(
  players: [Player, Player],
  gameMode: GameMode
): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 1,
    players,
    gameMode,
    screen: 'playing',
    winner: null,
    moveHistory: [],
    isDraw: false,
  };
}
