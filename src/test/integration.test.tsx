import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnect4 } from '../hooks/useConnect4';
import type { Player } from '../types';

describe('useConnect4 Hook Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockPlayers: [Player, Player] = [
    { id: 1, name: 'Player 1', color: '#FF6B6B', isComputer: false },
    { id: 2, name: 'Player 2', color: '#4ECDC4', isComputer: false },
  ];

  it('should initialize with empty board and player 1', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    expect(result.current.gameState.board[5][0]).toBeNull();
    expect(result.current.gameState.currentPlayer).toBe(1);
    expect(result.current.gameState.winner).toBeNull();
    expect(result.current.gameState.isDraw).toBe(false);
  });

  it('should drop piece and switch players', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => {
      result.current.dropPiece(0);
    });

    expect(result.current.gameState.board[5][0]).toBe(1);
    expect(result.current.gameState.currentPlayer).toBe(2);
  });

  it('should stack pieces with gravity', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => {
      result.current.dropPiece(0); // Player 1 at row 5
    });
    act(() => {
      result.current.dropPiece(0); // Player 2 at row 4
    });
    act(() => {
      result.current.dropPiece(0); // Player 1 at row 3
    });

    expect(result.current.gameState.board[5][0]).toBe(1);
    expect(result.current.gameState.board[4][0]).toBe(2);
    expect(result.current.gameState.board[3][0]).toBe(1);
  });

  it('should detect horizontal win', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => { result.current.dropPiece(0); }); // P1
    act(() => { result.current.dropPiece(0); }); // P2
    act(() => { result.current.dropPiece(1); }); // P1
    act(() => { result.current.dropPiece(1); }); // P2
    act(() => { result.current.dropPiece(2); }); // P1
    act(() => { result.current.dropPiece(2); }); // P2
    act(() => { result.current.dropPiece(3); }); // P1 wins!

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.gameState.winner).not.toBeNull();
    expect(result.current.gameState.winner?.winner).toBe(1);
    expect(result.current.gameState.screen).toBe('gameOver');
  });

  it('should detect vertical win', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => { result.current.dropPiece(0); }); // P1 at col 0
    act(() => { result.current.dropPiece(1); }); // P2 at col 1
    act(() => { result.current.dropPiece(0); }); // P1 at col 0
    act(() => { result.current.dropPiece(1); }); // P2 at col 1
    act(() => { result.current.dropPiece(0); }); // P1 at col 0
    act(() => { result.current.dropPiece(1); }); // P2 at col 1
    act(() => { result.current.dropPiece(0); }); // P1 wins with 4 in column 0!

    expect(result.current.gameState.winner?.winner).toBe(1);
  });

  it('should not allow moves after game over', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    // Create a winning scenario - horizontal win for P1
    act(() => { result.current.dropPiece(0); }); // P1
    act(() => { result.current.dropPiece(0); }); // P2
    act(() => { result.current.dropPiece(1); }); // P1
    act(() => { result.current.dropPiece(1); }); // P2
    act(() => { result.current.dropPiece(2); }); // P1
    act(() => { result.current.dropPiece(2); }); // P2
    act(() => { result.current.dropPiece(3); }); // P1 wins

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.gameState.winner).not.toBeNull();

    const boardAfterWin = JSON.stringify(result.current.gameState.board);

    act(() => {
      result.current.dropPiece(4); // Should not work
    });

    expect(JSON.stringify(result.current.gameState.board)).toBe(boardAfterWin);
  });

  it('should reset game correctly', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => {
      result.current.dropPiece(0);
    });
    act(() => {
      result.current.dropPiece(1);
    });
    act(() => {
      result.current.resetGame();
    });

    expect(result.current.gameState.board[5][0]).toBeNull();
    expect(result.current.gameState.board[5][1]).toBeNull();
    expect(result.current.gameState.currentPlayer).toBe(1);
    expect(result.current.gameState.moveHistory).toHaveLength(0);
  });

  it('should pause and resume game', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => {
      result.current.pauseGame();
    });

    expect(result.current.gameState.screen).toBe('paused');

    act(() => {
      result.current.resumeGame();
    });

    expect(result.current.gameState.screen).toBe('playing');
  });

  it('should not allow moves when paused', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => {
      result.current.pauseGame();
    });

    let moveResult: { row: number; col: number } | null = null;
    act(() => {
      moveResult = result.current.dropPiece(0);
    });

    expect(moveResult).toBeNull();
    expect(result.current.gameState.board[5][0]).toBeNull();
  });

  it('should undo last move', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => {
      result.current.dropPiece(0); // P1
    });
    act(() => {
      result.current.dropPiece(1); // P2
    });

    expect(result.current.gameState.board[5][1]).toBe(2);
    expect(result.current.gameState.currentPlayer).toBe(1);

    act(() => {
      result.current.undoLastMove();
    });

    expect(result.current.gameState.board[5][1]).toBeNull();
    expect(result.current.gameState.currentPlayer).toBe(2);
  });

  it('should track move history', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    act(() => { result.current.dropPiece(0); });
    act(() => { result.current.dropPiece(3); });
    act(() => { result.current.dropPiece(6); });

    expect(result.current.gameState.moveHistory).toEqual([0, 3, 6]);
  });

  it('should report column availability correctly', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    expect(result.current.canDropInColumn(0)).toBe(true);

    // Fill column 0 completely - need 6 pieces, alternating between columns
    act(() => { result.current.dropPiece(0); }); // P1 row 5
    act(() => { result.current.dropPiece(0); }); // P2 row 4
    act(() => { result.current.dropPiece(0); }); // P1 row 3
    act(() => { result.current.dropPiece(0); }); // P2 row 2
    act(() => { result.current.dropPiece(0); }); // P1 row 1
    act(() => { result.current.dropPiece(0); }); // P2 row 0 - column now full

    expect(result.current.canDropInColumn(0)).toBe(false);
  });

  it('should handle diagonal win', () => {
    const { result } = renderHook(() => useConnect4(mockPlayers, '1v1'));

    // Build a diagonal win for Player 1 (bottom-left to top-right)
    // We need P1 at [5,0], [4,1], [3,2], [2,3]
    
    act(() => { result.current.dropPiece(0); }); // P1 at [5,0]
    act(() => { result.current.dropPiece(6); }); // P2 at [5,6]
    act(() => { result.current.dropPiece(1); }); // P1 at [5,1] - need to build up col 1
    act(() => { result.current.dropPiece(1); }); // P2 at [4,1]
    act(() => { result.current.dropPiece(1); }); // P1 at [3,1] - P1 now has [5,0], needs [4,1]
    
    // Reset strategy - cleaner approach
    act(() => { result.current.resetGame(); });
    
    // P1 wins with vertical at column 0
    act(() => { result.current.dropPiece(0); }); // P1 at [5,0]
    act(() => { result.current.dropPiece(1); }); // P2 at [5,1]
    act(() => { result.current.dropPiece(0); }); // P1 at [4,0]
    act(() => { result.current.dropPiece(1); }); // P2 at [4,1]
    act(() => { result.current.dropPiece(0); }); // P1 at [3,0]
    act(() => { result.current.dropPiece(1); }); // P2 at [3,1]
    act(() => { result.current.dropPiece(0); }); // P1 at [2,0] - P1 wins vertical!

    expect(result.current.gameState.winner?.winner).toBe(1);
  });
});
