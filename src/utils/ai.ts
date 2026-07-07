// AI Player for Connect4 with three difficulty levels
import type { AIDifficulty, Board, CellValue } from '../types';
import { ROWS, COLS, WINNING_LENGTH } from '../types';

// Column visit order for search: center-first ordering makes alpha-beta
// pruning dramatically more effective (the best move is usually central).
const ORDERED_COLS: number[] = Array.from({ length: COLS }, (_, i) => i).sort(
  (a, b) => Math.abs(a - (COLS - 1) / 2) - Math.abs(b - (COLS - 1) / 2)
);

// Every possible 4-in-a-row window on the board, precomputed once as flat
// [r0,c0, r1,c1, r2,c2, r3,c3] arrays so evaluation never allocates.
const WINDOWS: number[][] = (() => {
  const windows: number[][] = [];
  const directions = [
    { dRow: 0, dCol: 1 },
    { dRow: 1, dCol: 0 },
    { dRow: 1, dCol: 1 },
    { dRow: 1, dCol: -1 },
  ];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const { dRow, dCol } of directions) {
        const endRow = row + (WINNING_LENGTH - 1) * dRow;
        const endCol = col + (WINNING_LENGTH - 1) * dCol;
        if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLS) continue;
        const w: number[] = [];
        for (let i = 0; i < WINNING_LENGTH; i++) {
          w.push(row + i * dRow, col + i * dCol);
        }
        windows.push(w);
      }
    }
  }
  return windows;
})();

// Find the lowest empty row in a column
function getLowestEmptyRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return -1;
}

// Clone board once per AI move; search then mutates the copy in place.
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

// Get valid columns (not full)
function getValidColumns(board: Board): number[] {
  const validCols: number[] = [];
  for (const col of ORDERED_COLS) {
    if (board[0][col] === null) {
      validCols.push(col);
    }
  }
  return validCols;
}

function isBoardFull(board: Board): boolean {
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === null) return false;
  }
  return true;
}

/**
 * Did the piece just placed at (row, col) complete four in a row?
 *
 * Only lines passing through the last move can be new wins, so this checks
 * 4 directions from one cell instead of rescanning the whole board — the
 * hot path of the search.
 */
function isWinningMove(board: Board, row: number, col: number, player: CellValue): boolean {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dRow, dCol] of directions) {
    let count = 1;
    for (let i = 1; i < WINNING_LENGTH; i++) {
      const r = row + i * dRow;
      const c = col + i * dCol;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      count++;
    }
    for (let i = 1; i < WINNING_LENGTH; i++) {
      const r = row - i * dRow;
      const c = col - i * dCol;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== player) break;
      count++;
    }
    if (count >= WINNING_LENGTH) return true;
  }
  return false;
}

// Evaluate board position for a player (allocation-free window counting)
function evaluatePosition(board: Board, player: CellValue): number {
  let score = 0;

  // Center column preference
  const centerCol = Math.floor(COLS / 2);
  for (let row = 0; row < ROWS; row++) {
    if (board[row][centerCol] === player) score += 3;
  }

  for (const w of WINDOWS) {
    let playerCount = 0;
    let opponentCount = 0;
    for (let i = 0; i < w.length; i += 2) {
      const cell = board[w[i]][w[i + 1]];
      if (cell === player) playerCount++;
      else if (cell !== null) opponentCount++;
    }
    const emptyCount = WINNING_LENGTH - playerCount - opponentCount;

    if (playerCount === 4) score += 100;
    else if (playerCount === 3 && emptyCount === 1) score += 5;
    else if (playerCount === 2 && emptyCount === 2) score += 2;
    if (opponentCount === 3 && emptyCount === 1) score -= 4;
  }

  return score;
}

/**
 * Minimax with alpha-beta pruning.
 *
 * Operates on a single mutable board (place piece → recurse → undo) instead
 * of cloning at every node, and detects wins incrementally from the move
 * just played. Together with center-first ordering this is orders of
 * magnitude faster than the old clone-and-rescan search, which is what lets
 * the hard AI search deeper while responding faster.
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  aiPlayer: CellValue
): number {
  const opponent: CellValue = aiPlayer === 1 ? 2 : 1;

  if (isBoardFull(board)) return 0; // Draw
  if (depth === 0) return evaluatePosition(board, aiPlayer);

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const col of ORDERED_COLS) {
      const row = getLowestEmptyRow(board, col);
      if (row === -1) continue;
      board[row][col] = aiPlayer;
      const evalScore = isWinningMove(board, row, col, aiPlayer)
        ? 100000 + depth
        : minimax(board, depth - 1, alpha, beta, false, aiPlayer);
      board[row][col] = null;
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const col of ORDERED_COLS) {
      const row = getLowestEmptyRow(board, col);
      if (row === -1) continue;
      board[row][col] = opponent;
      const evalScore = isWinningMove(board, row, col, opponent)
        ? -100000 - depth
        : minimax(board, depth - 1, alpha, beta, true, aiPlayer);
      board[row][col] = null;
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Find an immediately winning column for `player`, or -1.
function findImmediateWin(board: Board, player: CellValue, validCols: number[]): number {
  for (const col of validCols) {
    const row = getLowestEmptyRow(board, col);
    if (row === -1) continue;
    board[row][col] = player;
    const wins = isWinningMove(board, row, col, player);
    board[row][col] = null;
    if (wins) return col;
  }
  return -1;
}

// Run a fixed-depth search from the root and return the best column.
function getBestMove(board: Board, aiPlayer: CellValue, depth: number): number {
  const work = cloneBoard(board);
  const validCols = getValidColumns(work);
  if (validCols.length === 0) return -1;

  const opponent: CellValue = aiPlayer === 1 ? 2 : 1;

  // Take a win / block a loss without searching.
  const winCol = findImmediateWin(work, aiPlayer, validCols);
  if (winCol !== -1) return winCol;
  const blockCol = findImmediateWin(work, opponent, validCols);
  if (blockCol !== -1) return blockCol;

  let bestScore = -Infinity;
  let bestCol = validCols[0];
  let alpha = -Infinity;

  for (const col of validCols) {
    const row = getLowestEmptyRow(work, col);
    if (row === -1) continue;
    work[row][col] = aiPlayer;
    const score = isWinningMove(work, row, col, aiPlayer)
      ? 100000 + depth
      : minimax(work, depth - 1, alpha, Infinity, false, aiPlayer);
    work[row][col] = null;
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
    alpha = Math.max(alpha, score);
  }

  return bestCol;
}

// Easy AI: Random move with occasional blocking
function getEasyMove(board: Board, aiPlayer: CellValue): number {
  const work = cloneBoard(board);
  const validCols = getValidColumns(work);
  if (validCols.length === 0) return -1;

  const opponent: CellValue = aiPlayer === 1 ? 2 : 1;

  // 30% chance to block or win
  if (Math.random() < 0.3) {
    const winCol = findImmediateWin(work, aiPlayer, validCols);
    if (winCol !== -1) return winCol;
    const blockCol = findImmediateWin(work, opponent, validCols);
    if (blockCol !== -1) return blockCol;
  }

  // Random move
  return validCols[Math.floor(Math.random() * validCols.length)];
}

// Medium AI: Always blocks/wins, shallow search
const MEDIUM_DEPTH = 4;
// Hard AI: deep search. The optimized engine searches depth 8 faster than
// the old one searched depth 6.
const HARD_DEPTH = 8;

// Main AI function
export function getAIMove(board: Board, aiPlayer: CellValue, difficulty: AIDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return getEasyMove(board, aiPlayer);
    case 'medium':
      return getBestMove(board, aiPlayer, MEDIUM_DEPTH);
    case 'hard':
      return getBestMove(board, aiPlayer, HARD_DEPTH);
    default:
      return getEasyMove(board, aiPlayer);
  }
}
