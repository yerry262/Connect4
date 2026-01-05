// AI Player for Connect4 with three difficulty levels
import type { AIDifficulty, Board, CellValue } from '../types';
import { ROWS, COLS, WINNING_LENGTH } from '../types';

// Find the lowest empty row in a column
function getLowestEmptyRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return -1;
}

// Clone board for simulation
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

// Get valid columns (not full)
function getValidColumns(board: Board): number[] {
  const validCols: number[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === null) {
      validCols.push(col);
    }
  }
  return validCols;
}

// Check for a win
function checkWin(board: Board, player: CellValue): boolean {
  const directions = [
    { dRow: 0, dCol: 1 },
    { dRow: 1, dCol: 0 },
    { dRow: 1, dCol: 1 },
    { dRow: 1, dCol: -1 },
  ];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col] !== player) continue;

      for (const { dRow, dCol } of directions) {
        let count = 0;
        for (let i = 0; i < WINNING_LENGTH; i++) {
          const r = row + i * dRow;
          const c = col + i * dCol;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
          if (board[r][c] === player) count++;
          else break;
        }
        if (count === WINNING_LENGTH) return true;
      }
    }
  }
  return false;
}

// Simulate a move
function makeMove(board: Board, col: number, player: CellValue): Board | null {
  const row = getLowestEmptyRow(board, col);
  if (row === -1) return null;
  const newBoard = cloneBoard(board);
  newBoard[row][col] = player;
  return newBoard;
}

// Evaluate board position for a player
function evaluatePosition(board: Board, player: CellValue): number {
  const opponent: CellValue = player === 1 ? 2 : 1;
  let score = 0;

  // Center column preference
  const centerCol = Math.floor(COLS / 2);
  for (let row = 0; row < ROWS; row++) {
    if (board[row][centerCol] === player) score += 3;
  }

  // Evaluate all windows of 4
  const directions = [
    { dRow: 0, dCol: 1 },
    { dRow: 1, dCol: 0 },
    { dRow: 1, dCol: 1 },
    { dRow: 1, dCol: -1 },
  ];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const { dRow, dCol } of directions) {
        const window: CellValue[] = [];
        for (let i = 0; i < WINNING_LENGTH; i++) {
          const r = row + i * dRow;
          const c = col + i * dCol;
          if (r < 0 || r >= ROWS || c < 0 || c >= COLS) break;
          window.push(board[r][c]);
        }
        if (window.length === WINNING_LENGTH) {
          score += evaluateWindow(window, player, opponent);
        }
      }
    }
  }

  return score;
}

function evaluateWindow(window: CellValue[], player: CellValue, opponent: CellValue): number {
  const playerCount = window.filter((c) => c === player).length;
  const opponentCount = window.filter((c) => c === opponent).length;
  const emptyCount = window.filter((c) => c === null).length;

  if (playerCount === 4) return 100;
  if (playerCount === 3 && emptyCount === 1) return 5;
  if (playerCount === 2 && emptyCount === 2) return 2;
  if (opponentCount === 3 && emptyCount === 1) return -4;
  return 0;
}

// Minimax with alpha-beta pruning
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  aiPlayer: CellValue
): number {
  const opponent: CellValue = aiPlayer === 1 ? 2 : 1;
  const validCols = getValidColumns(board);

  // Terminal conditions
  if (checkWin(board, aiPlayer)) return 100000 + depth;
  if (checkWin(board, opponent)) return -100000 - depth;
  if (validCols.length === 0) return 0; // Draw
  if (depth === 0) return evaluatePosition(board, aiPlayer);

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const col of validCols) {
      const newBoard = makeMove(board, col, aiPlayer);
      if (!newBoard) continue;
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of validCols) {
      const newBoard = makeMove(board, col, opponent);
      if (!newBoard) continue;
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Easy AI: Random move with occasional blocking
function getEasyMove(board: Board, aiPlayer: CellValue): number {
  const validCols = getValidColumns(board);
  if (validCols.length === 0) return -1;

  const opponent: CellValue = aiPlayer === 1 ? 2 : 1;

  // 30% chance to block or win
  if (Math.random() < 0.3) {
    // Check for winning move
    for (const col of validCols) {
      const newBoard = makeMove(board, col, aiPlayer);
      if (newBoard && checkWin(newBoard, aiPlayer)) return col;
    }
    // Check for blocking move
    for (const col of validCols) {
      const newBoard = makeMove(board, col, opponent);
      if (newBoard && checkWin(newBoard, opponent)) return col;
    }
  }

  // Random move
  return validCols[Math.floor(Math.random() * validCols.length)];
}

// Medium AI: Always blocks/wins, some strategy
function getMediumMove(board: Board, aiPlayer: CellValue): number {
  const validCols = getValidColumns(board);
  if (validCols.length === 0) return -1;

  const opponent: CellValue = aiPlayer === 1 ? 2 : 1;

  // Check for winning move
  for (const col of validCols) {
    const newBoard = makeMove(board, col, aiPlayer);
    if (newBoard && checkWin(newBoard, aiPlayer)) return col;
  }

  // Check for blocking move
  for (const col of validCols) {
    const newBoard = makeMove(board, col, opponent);
    if (newBoard && checkWin(newBoard, opponent)) return col;
  }

  // Use shallow minimax (depth 3)
  let bestScore = -Infinity;
  let bestCol = validCols[0];

  for (const col of validCols) {
    const newBoard = makeMove(board, col, aiPlayer);
    if (!newBoard) continue;
    const score = minimax(newBoard, 3, -Infinity, Infinity, false, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

// Hard AI: Deep minimax with alpha-beta pruning
function getHardMove(board: Board, aiPlayer: CellValue): number {
  const validCols = getValidColumns(board);
  if (validCols.length === 0) return -1;

  const opponent: CellValue = aiPlayer === 1 ? 2 : 1;

  // Check for winning move first
  for (const col of validCols) {
    const newBoard = makeMove(board, col, aiPlayer);
    if (newBoard && checkWin(newBoard, aiPlayer)) return col;
  }

  // Check for blocking move
  for (const col of validCols) {
    const newBoard = makeMove(board, col, opponent);
    if (newBoard && checkWin(newBoard, opponent)) return col;
  }

  // Deep minimax (depth 6)
  let bestScore = -Infinity;
  let bestCol = validCols[0];

  // Prefer center columns in evaluation order
  const orderedCols = [...validCols].sort((a, b) => {
    const center = COLS / 2;
    return Math.abs(a - center) - Math.abs(b - center);
  });

  for (const col of orderedCols) {
    const newBoard = makeMove(board, col, aiPlayer);
    if (!newBoard) continue;
    const score = minimax(newBoard, 6, -Infinity, Infinity, false, aiPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

// Main AI function
export function getAIMove(board: Board, aiPlayer: CellValue, difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return getEasyMove(board, aiPlayer);
    case 'medium':
      return getMediumMove(board, aiPlayer);
    case 'hard':
      return getHardMove(board, aiPlayer);
    default:
      return getEasyMove(board, aiPlayer);
  }
}
