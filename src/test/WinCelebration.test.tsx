import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WinCelebration } from '../components/WinCelebration';

describe('WinCelebration', () => {
  it('renders correctly', () => {
    render(<WinCelebration />);
    expect(screen.getByText('CONNECT 4!!')).toBeInTheDocument();
  });
});
