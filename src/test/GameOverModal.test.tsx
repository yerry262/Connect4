import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverModal } from '../components/GameOverModal';
import type { Player } from '../types';

describe('GameOverModal Component', () => {
  const mockWinner: Player = {
    id: 1,
    name: 'Alice',
    color: '#FF6B6B',
    isComputer: false,
  };

  it('should display winner message when there is a winner', () => {
    render(
      <GameOverModal
        winner={mockWinner}
        isDraw={false}
        onPlayAgain={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText('🎉 Winner! 🎉')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('should display draw message when game is a draw', () => {
    render(
      <GameOverModal
        winner={null}
        isDraw={true}
        onPlayAgain={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByText("It's a Draw!")).toBeInTheDocument();
    expect(screen.getByText('The board is full. No one wins this time!')).toBeInTheDocument();
  });

  it('should render Play Again button', () => {
    render(
      <GameOverModal
        winner={mockWinner}
        isDraw={false}
        onPlayAgain={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument();
  });

  it('should render Menu button', () => {
    render(
      <GameOverModal
        winner={mockWinner}
        isDraw={false}
        onPlayAgain={vi.fn()}
        onExit={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('should call onPlayAgain when Play Again button is clicked', () => {
    const onPlayAgain = vi.fn();
    render(
      <GameOverModal
        winner={mockWinner}
        isDraw={false}
        onPlayAgain={onPlayAgain}
        onExit={vi.fn()}
      />
    );

    const playAgainButton = screen.getByRole('button', { name: /play again/i });
    fireEvent.click(playAgainButton);

    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it('should call onExit when Menu button is clicked', () => {
    const onExit = vi.fn();
    render(
      <GameOverModal
        winner={mockWinner}
        isDraw={false}
        onPlayAgain={vi.fn()}
        onExit={onExit}
      />
    );

    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
