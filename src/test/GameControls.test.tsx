import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameControls } from '../components/GameControls';

describe('GameControls Component', () => {
  const defaultProps = {
    isPaused: false,
    isGameOver: false,
    onPause: vi.fn(),
    onResume: vi.fn(),
    onReset: vi.fn(),
    onExit: vi.fn(),
    onUndo: vi.fn(),
    canUndo: true,
  };

  it('should render pause button when game is playing', () => {
    render(<GameControls {...defaultProps} />);

    const pauseButton = screen.getByTitle('Pause');
    expect(pauseButton).toBeInTheDocument();
  });

  it('should render resume button when game is paused', () => {
    render(<GameControls {...defaultProps} isPaused={true} />);

    const resumeButton = screen.getByTitle('Resume');
    expect(resumeButton).toBeInTheDocument();
  });

  it('should call onPause when pause button is clicked', () => {
    const onPause = vi.fn();
    render(<GameControls {...defaultProps} onPause={onPause} />);

    const pauseButton = screen.getByTitle('Pause');
    fireEvent.click(pauseButton);

    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('should render undo button', () => {
    render(<GameControls {...defaultProps} />);

    const undoButton = screen.getByTitle('Undo');
    expect(undoButton).toBeInTheDocument();
  });

  it('should disable undo button when canUndo is false', () => {
    render(<GameControls {...defaultProps} canUndo={false} />);

    const undoButton = screen.getByTitle('Undo');
    expect(undoButton).toBeDisabled();
  });

  it('should render reset button', () => {
    render(<GameControls {...defaultProps} />);

    const resetButton = screen.getByTitle('Reset Game');
    expect(resetButton).toBeInTheDocument();
  });

  it('should show reset confirmation dialog when reset is clicked', () => {
    render(<GameControls {...defaultProps} />);

    const resetButton = screen.getByTitle('Reset Game');
    fireEvent.click(resetButton);

    expect(screen.getByText('Reset Game?')).toBeInTheDocument();
  });

  it('should render exit button', () => {
    render(<GameControls {...defaultProps} />);

    const exitButton = screen.getByTitle('Exit to Menu');
    expect(exitButton).toBeInTheDocument();
  });

  it('should show exit confirmation dialog when exit is clicked', () => {
    render(<GameControls {...defaultProps} />);

    const exitButton = screen.getByTitle('Exit to Menu');
    fireEvent.click(exitButton);

    expect(screen.getByText('Exit to Menu?')).toBeInTheDocument();
  });

  it('should not render pause button when game is over', () => {
    render(<GameControls {...defaultProps} isGameOver={true} />);

    expect(screen.queryByTitle('Pause')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Resume')).not.toBeInTheDocument();
  });

  it('should show paused overlay when game is paused', () => {
    render(<GameControls {...defaultProps} isPaused={true} />);

    expect(screen.getByText('PAUSED')).toBeInTheDocument();
  });
});
