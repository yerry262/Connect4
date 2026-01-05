import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageManager } from '../utils/storageManager';
import { createInitialState } from '../types';

describe('storageManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should save and load game state', () => {
    const players: any = [{ id: 1 }, { id: 2 }];
    const state = createInitialState(players, '1v1');
    
    storageManager.saveGameState(state);
    const loaded = storageManager.loadGameState();
    
    expect(loaded).toEqual(state);
  });

  it('should return null if no saved state', () => {
    const loaded = storageManager.loadGameState();
    expect(loaded).toBeNull();
  });

  it('should update stats correctly', () => {
    const stats1 = storageManager.updateStats(1);
    expect(stats1.gamesPlayed).toBe(1);
    expect(stats1.player1Wins).toBe(1);
    expect(stats1.player2Wins).toBe(0);

    const stats2 = storageManager.updateStats(2);
    expect(stats2.gamesPlayed).toBe(2);
    expect(stats2.player1Wins).toBe(1);
    expect(stats2.player2Wins).toBe(1);

    const stats3 = storageManager.updateStats(null);
    expect(stats3.gamesPlayed).toBe(3);
    expect(stats3.draws).toBe(1);
  });
});
