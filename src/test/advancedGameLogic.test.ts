import { describe, it, expect } from 'vitest';
import { testUtils } from '../hooks/useConnect4';
import { COLS, createEmptyBoard, ROWS } from '../types';
import type { Board } from '../types';

const { checkWinner, isBoardFull, getLowestEmptyRow } = testUtils;

describe('Advanced Game Logic', () => {
  describe('Complex winning scenarios', () => {
    it('should detect multiple winning lines (overlapping)', () => {
      const board = createEmptyBoard();
      // Create a board where player has both horizontal and vertical wins
      board[5][3] = 1;
      board[5][4] = 1;
      board[5][5] = 1;
      board[5][6] = 1; // Horizontal win
      board[4][3] = 1;
      board[3][3] = 1;
      board[2][3] = 1; // Also vertical win from [5,3] to [2,3]
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(1);
      expect(result?.cells).toHaveLength(4);
    });

    it('should detect diagonal win at top-right corner', () => {
      const board = createEmptyBoard();
      board[0][3] = 2;
      board[1][4] = 2;
      board[2][5] = 2;
      board[3][6] = 2;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(2);
    });

    it('should detect diagonal win at bottom-left corner', () => {
      const board = createEmptyBoard();
      board[5][0] = 1;
      board[4][1] = 1;
      board[3][2] = 1;
      board[2][3] = 1;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(1);
    });

    it('should detect anti-diagonal win at top-left', () => {
      const board = createEmptyBoard();
      board[0][3] = 2;
      board[1][2] = 2;
      board[2][1] = 2;
      board[3][0] = 2;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(2);
    });

    it('should detect anti-diagonal win at bottom-right', () => {
      const board = createEmptyBoard();
      board[5][6] = 1;
      board[4][5] = 1;
      board[3][4] = 1;
      board[2][3] = 1;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(1);
    });

    it('should detect win with more than 4 in a row', () => {
      const board = createEmptyBoard();
      // 5 in a row horizontally
      board[5][0] = 1;
      board[5][1] = 1;
      board[5][2] = 1;
      board[5][3] = 1;
      board[5][4] = 1;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(1);
    });

    it('should detect win with 6 in a row vertically', () => {
      const board = createEmptyBoard();
      // All 6 rows in column 3
      for (let row = 0; row < 6; row++) {
        board[row][3] = 2;
      }
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(2);
    });
  });

  describe('Near-win scenarios', () => {
    it('should not detect win with 3 in a row and gap', () => {
      const board = createEmptyBoard();
      board[5][0] = 1;
      board[5][1] = 1;
      board[5][2] = 1;
      // Gap at [5][3]
      board[5][4] = 1;
      
      expect(checkWinner(board)).toBeNull();
    });

    it('should not detect win with 3 in diagonal', () => {
      const board = createEmptyBoard();
      board[5][0] = 2;
      board[4][1] = 2;
      board[3][2] = 2;
      // Missing [2][3]
      
      expect(checkWinner(board)).toBeNull();
    });

    it('should handle board with 3 pieces in multiple directions', () => {
      const board = createEmptyBoard();
      // Player 1 has 3 in multiple places but no win
      board[5][0] = 1;
      board[5][1] = 1;
      board[5][2] = 1;
      
      board[4][3] = 1;
      board[3][3] = 1;
      board[2][3] = 1;
      
      expect(checkWinner(board)).toBeNull();
    });
  });

  describe('Complex board states', () => {
    it('should handle board with both players having near-wins', () => {
      const board = createEmptyBoard();
      // Player 1 has 3 in a row
      board[5][0] = 1;
      board[5][1] = 1;
      board[5][2] = 1;
      
      // Player 2 also has 3 in a row
      board[4][0] = 2;
      board[4][1] = 2;
      board[4][2] = 2;
      
      expect(checkWinner(board)).toBeNull();
    });

    it('should detect first winning line in board with multiple potential wins', () => {
      const board = createEmptyBoard();
      // Create two separate winning lines for same player
      // Horizontal win
      board[5][0] = 1;
      board[5][1] = 1;
      board[5][2] = 1;
      board[5][3] = 1;
      
      // Separate vertical win
      board[4][6] = 1;
      board[3][6] = 1;
      board[2][6] = 1;
      board[1][6] = 1;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(1);
    });

    it('should handle sparse board with pieces spread out', () => {
      const board = createEmptyBoard();
      // Random sparse placement
      board[0][0] = 1;
      board[2][3] = 2;
      board[5][6] = 1;
      board[1][5] = 2;
      board[4][2] = 1;
      
      expect(checkWinner(board)).toBeNull();
      expect(isBoardFull(board)).toBe(false);
    });

    it('should correctly identify draw with no winner', () => {
      const board: Board = [
        [1, 2, 1, 2, 1, 2, 1],
        [2, 1, 2, 1, 2, 1, 2],
        [1, 2, 1, 2, 1, 2, 1],
        [1, 2, 1, 2, 1, 2, 1],
        [2, 1, 2, 1, 2, 1, 2],
        [2, 1, 2, 1, 2, 1, 2],
      ];
      
      expect(isBoardFull(board)).toBe(true);
      expect(checkWinner(board)).toBeNull();
    });
  });

  describe('Column operations', () => {
    it('should handle partially filled columns correctly', () => {
      const board = createEmptyBoard();
      board[5][0] = 1;
      board[4][0] = 2;
      board[3][0] = 1;
      
      expect(getLowestEmptyRow(board, 0)).toBe(2);
    });

    it('should return -1 for completely full column', () => {
      const board = createEmptyBoard();
      for (let row = 0; row < ROWS; row++) {
        board[row][3] = (row % 2 === 0 ? 1 : 2) as 1 | 2;
      }
      
      expect(getLowestEmptyRow(board, 3)).toBe(-1);
    });

    it('should handle all columns independently', () => {
      const board = createEmptyBoard();
      board[5][0] = 1; // Column 0 has 1 piece
      board[5][1] = 2; // Column 1 has 1 piece
      board[4][1] = 1; // Column 1 has 2 pieces
      // Column 2 is empty
      
      expect(getLowestEmptyRow(board, 0)).toBe(4);
      expect(getLowestEmptyRow(board, 1)).toBe(3);
      expect(getLowestEmptyRow(board, 2)).toBe(5);
    });

    it('should handle boundary columns', () => {
      const board = createEmptyBoard();
      expect(getLowestEmptyRow(board, 0)).toBe(5); // Leftmost
      expect(getLowestEmptyRow(board, 6)).toBe(5); // Rightmost
    });
  });

  describe('Board validation', () => {
    it('should handle board with only one piece', () => {
      const board = createEmptyBoard();
      board[5][3] = 1;
      
      expect(checkWinner(board)).toBeNull();
      expect(isBoardFull(board)).toBe(false);
    });

    it('should handle completely empty board', () => {
      const board = createEmptyBoard();
      
      expect(checkWinner(board)).toBeNull();
      expect(isBoardFull(board)).toBe(false);
      
      for (let col = 0; col < COLS; col++) {
        expect(getLowestEmptyRow(board, col)).toBe(5);
      }
    });

    it('should handle board with alternating pattern', () => {
      const board = createEmptyBoard();
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if ((row + col) % 3 === 0) {
            board[row][col] = (row % 2 === 0 ? 1 : 2) as 1 | 2;
          }
        }
      }
      
      // Check it doesn't crash and produces valid results
      const winner = checkWinner(board);
      const full = isBoardFull(board);
      
      expect(winner === null || winner.winner === 1 || winner.winner === 2).toBe(true);
      expect(typeof full).toBe('boolean');
    });
  });

  describe('Edge case wins', () => {
    it('should detect horizontal win at very top row', () => {
      const board = createEmptyBoard();
      board[0][0] = 1;
      board[0][1] = 1;
      board[0][2] = 1;
      board[0][3] = 1;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(1);
    });

    it('should detect vertical win in rightmost column', () => {
      const board = createEmptyBoard();
      board[5][6] = 2;
      board[4][6] = 2;
      board[3][6] = 2;
      board[2][6] = 2;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(2);
    });

    it('should detect win in middle of board', () => {
      const board = createEmptyBoard();
      // Horizontal win in middle
      board[3][2] = 1;
      board[3][3] = 1;
      board[3][4] = 1;
      board[3][5] = 1;
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(1);
    });
  });

  describe('Performance scenarios', () => {
    it('should handle checking large number of empty boards quickly', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        const board = createEmptyBoard();
        checkWinner(board);
        isBoardFull(board);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle checking full boards quickly', () => {
      const board: Board = [
        [1, 2, 1, 2, 1, 2, 1],
        [2, 1, 2, 1, 2, 1, 2],
        [1, 2, 1, 2, 1, 2, 1],
        [2, 1, 2, 1, 2, 1, 2],
        [1, 2, 1, 2, 1, 2, 1],
        [2, 1, 2, 1, 2, 1, 2],
      ];
      
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        checkWinner(board);
        isBoardFull(board);
      }
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Realistic game scenarios', () => {
    it('should handle a back-and-forth game leading to draw', () => {
      const board: Board = [
        [1, 2, 1, 2, 1, 2, 1],
        [2, 1, 2, 1, 2, 1, 2],
        [1, 2, 1, 2, 1, 2, 1],
        [1, 2, 1, 2, 1, 2, 1],
        [2, 1, 2, 1, 2, 1, 2],
        [2, 1, 2, 2, 1, 2, 1],
      ];
      
      expect(isBoardFull(board)).toBe(true);
      expect(checkWinner(board)).toBeNull();
    });

    it('should handle a game where player wins on last move', () => {
      const board: Board = [
        [1, 2, 1, 1, 2, 1, 2],
        [2, 1, 2, 2, 1, 2, 1],
        [1, 2, 1, 1, 2, 1, 2],
        [2, 1, 2, 2, 1, 2, 1],
        [1, 2, 1, 1, 2, 1, 2],
        [1, 1, 1, 1, 2, 2, 2], // Player 1 wins on bottom row
      ];
      
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result?.winner).toBe(1);
    });

    it('should handle aggressive vertical stacking game', () => {
      const board = createEmptyBoard();
      // Players stack in same columns
      board[5][3] = 1;
      board[4][3] = 2;
      board[3][3] = 1;
      board[2][3] = 2;
      board[1][3] = 1;
      board[0][3] = 2;
      
      board[5][4] = 2;
      board[4][4] = 1;
      board[3][4] = 2;
      board[2][4] = 1;
      
      expect(checkWinner(board)).toBeNull();
    });
  });

  describe('Symmetry tests', () => {
    it('should detect horizontal win regardless of position', () => {
      for (let row = 0; row < ROWS; row++) {
        for (let startCol = 0; startCol <= COLS - 4; startCol++) {
          const board = createEmptyBoard();
          for (let i = 0; i < 4; i++) {
            board[row][startCol + i] = 1;
          }
          
          const result = checkWinner(board);
          expect(result).not.toBeNull();
          expect(result?.winner).toBe(1);
        }
      }
    });

    it('should detect vertical win in any column', () => {
      for (let col = 0; col < COLS; col++) {
        for (let startRow = 0; startRow <= ROWS - 4; startRow++) {
          const board = createEmptyBoard();
          for (let i = 0; i < 4; i++) {
            board[startRow + i][col] = 2;
          }
          
          const result = checkWinner(board);
          expect(result).not.toBeNull();
          expect(result?.winner).toBe(2);
        }
      }
    });
  });
});
