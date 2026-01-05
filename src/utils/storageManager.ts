import { GameState, Player } from '../types/game';

const STORAGE_KEYS = {
  GAME_STATE: 'connect4_game_state',
  STATS: 'connect4_stats',
};

export interface GameStats {
  gamesPlayed: number;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  lastPlayed: string;
}

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  player1Wins: 0,
  player2Wins: 0,
  draws: 0,
  lastPlayed: new Date().toISOString(),
};

export const storageManager = {
  saveGameState: (state: GameState) => {
    try {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  },

  loadGameState: (): GameState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  },

  clearGameState: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    } catch (error) {
      console.error('Failed to clear game state:', error);
    }
  },

  saveStats: (stats: GameStats) => {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  },

  loadStats: (): GameStats => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATS);
      return saved ? JSON.parse(saved) : DEFAULT_STATS;
    } catch (error) {
      console.error('Failed to load stats:', error);
      return DEFAULT_STATS;
    }
  },

  updateStats: (winner: 1 | 2 | null) => {
    const stats = storageManager.loadStats();
    stats.gamesPlayed++;
    stats.lastPlayed = new Date().toISOString();

    if (winner === 1) {
      stats.player1Wins++;
    } else if (winner === 2) {
      stats.player2Wins++;
    } else {
      stats.draws++;
    }

    storageManager.saveStats(stats);
    return stats;
  },
};
