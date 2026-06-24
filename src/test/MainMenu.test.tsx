import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainMenu } from '../components/MainMenu';

describe('MainMenu Component', () => {
  it('should render the game title', () => {
    const mockStartGame = vi.fn();
    render(<MainMenu onStartGame={mockStartGame} />);

    expect(screen.getByText('CONNECT 4')).toBeInTheDocument();
    expect(screen.getByText('Drop, Connect, Win!')).toBeInTheDocument();
  });

  it('should render game mode selection', () => {
    const mockStartGame = vi.fn();
    render(<MainMenu onStartGame={mockStartGame} />);

    expect(screen.getByText('Game Mode')).toBeInTheDocument();
    expect(screen.getByText('1 vs 1')).toBeInTheDocument();
  });

  it('should render player name inputs', () => {
    const mockStartGame = vi.fn();
    render(<MainMenu onStartGame={mockStartGame} />);

    // Switch to local 1 vs 1 so both human players are shown (the default
    // mode is now vs Computer, where Player 2 is the AI).
    fireEvent.click(screen.getByRole('button', { name: /1 vs 1/i }));

    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
  });

  it('should render start button', () => {
    const mockStartGame = vi.fn();
    render(<MainMenu onStartGame={mockStartGame} />);

    expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
  });

  it('should call onStartGame when start button is clicked', () => {
    const mockStartGame = vi.fn();
    render(<MainMenu onStartGame={mockStartGame} />);

    fireEvent.click(screen.getByRole('button', { name: /1 vs 1/i }));

    const startButton = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(startButton);

    expect(mockStartGame).toHaveBeenCalledTimes(1);
    expect(mockStartGame).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, name: 'Player 1' }),
        expect.objectContaining({ id: 2, name: 'Player 2' }),
      ]),
      '1v1',
      undefined,
      false,
      30
    );
  });

  it('should update player name when typing', () => {
    const mockStartGame = vi.fn();
    render(<MainMenu onStartGame={mockStartGame} />);

    fireEvent.click(screen.getByRole('button', { name: /1 vs 1/i }));

    const inputs = screen.getAllByPlaceholderText('Enter name');
    fireEvent.change(inputs[0], { target: { value: 'Alice' } });
    fireEvent.change(inputs[1], { target: { value: 'Bob' } });

    const startButton = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(startButton);

    expect(mockStartGame).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Alice' }),
        expect.objectContaining({ name: 'Bob' }),
      ]),
      '1v1',
      undefined,
      false,
      30
    );
  });

  it('should render color picker buttons for both players', () => {
    const mockStartGame = vi.fn();
    render(<MainMenu onStartGame={mockStartGame} />);

    // Each player has 5 color options
    const colorButtons = screen.getAllByRole('button').filter(
      (button) => button.style.borderRadius === '50%'
    );

    // 5 colors for player 1 + 5 colors for player 2 = 10 color buttons
    expect(colorButtons.length).toBe(10);
  });
});
