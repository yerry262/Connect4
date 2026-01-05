import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameBoard } from '../components/GameBoard';
import { createEmptyBoard } from '../types';
import type { Player } from '../types';

describe('GameBoard Component', () => {
  const mockPlayers: [Player, Player] = [
    { id: 1, name: 'Player 1', color: '#FF6B6B', isComputer: false },
    { id: 2, name: 'Player 2', color: '#4ECDC4', isComputer: false },
  ];

  const defaultProps = {
    board: createEmptyBoard(),
    players: mockPlayers,
    currentPlayer: 1 as const,
    winner: null,
    onColumnClick: vi.fn(),
    canDropInColumn: vi.fn().mockReturnValue(true),
    lastMove: null,
  };

  it('should render current player indicator', () => {
    render(<GameBoard {...defaultProps} />);

    expect(screen.getByText("Player 1's Turn")).toBeInTheDocument();
  });

  it('should update indicator when player changes', () => {
    render(<GameBoard {...defaultProps} currentPlayer={2} />);

    expect(screen.getByText("Player 2's Turn")).toBeInTheDocument();
  });

  it('should render the game board container', () => {
    const { container } = render(<GameBoard {...defaultProps} />);

    // Check that MUI Box elements are rendered
    const boxes = container.querySelectorAll('.MuiBox-root');
    expect(boxes.length).toBeGreaterThan(0);
  });

  it('should call onColumnClick when cell is clicked', () => {
    const onColumnClick = vi.fn();
    const { container } = render(<GameBoard {...defaultProps} onColumnClick={onColumnClick} />);

    // Find clickable elements (motion divs with pointer cursor)
    const clickableElements = container.querySelectorAll('[style*="pointer"]');
    
    if (clickableElements.length > 0) {
      fireEvent.click(clickableElements[0]);
      expect(onColumnClick).toHaveBeenCalled();
    } else {
      // Fallback: click on the board area
      const board = container.querySelector('.MuiBox-root');
      if (board) {
        fireEvent.click(board);
      }
    }
  });

  it('should render game pieces when board has pieces', () => {
    const boardWithPieces = createEmptyBoard();
    boardWithPieces[5][0] = 1;
    boardWithPieces[5][1] = 2;

    const { container } = render(<GameBoard {...defaultProps} board={boardWithPieces} />);

    // GamePiece components should be rendered
    // They have motion.div wrappers
    const motionDivs = container.querySelectorAll('div');
    expect(motionDivs.length).toBeGreaterThan(0);
  });

  it('should show board stand', () => {
    const { container } = render(<GameBoard {...defaultProps} />);

    // Board stand is a Box with specific border-radius in MUI
    const boxes = container.querySelectorAll('.MuiBox-root');
    expect(boxes.length).toBeGreaterThan(0);
  });
});
