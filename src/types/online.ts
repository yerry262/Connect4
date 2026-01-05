// Player statistics tracking
export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestWinStreak: number;
  score: number; // Calculated: wins * 100 + draws * 25 - losses * 10
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';
  lastActive: string; // ISO Date string
}

export interface OnlineUser {
  id: string;
  username: string;
  friends: string[]; // Array of user IDs
  isOnline: boolean;
  stats: PlayerStats;
  avatarColor: string; // Hex color for avatar
  bio: string;
  createdAt: string; // ISO Date string
}

export interface OnlineGame {
  id: string;
  players: [string, string]; // [Player1 ID, Player2 ID]
  currentTurn: string; // User ID whose turn it is
  board: (number | null)[][]; // 6x7 grid, 1 for P1, 2 for P2, null for empty
  status: 'active' | 'completed' | 'abandoned';
  winner?: string | null; // User ID or null for draw
  lastMove: string; // ISO Date string
  createdAt: string; // ISO Date string
  moveCount: number;
  winningLine?: [number, number][]; // Array of [row, col] for winning pieces
}

export interface OnlineChallenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string; // ISO Date string
  message?: string; // Optional message with challenge
  expiresAt: string; // ISO Date string
}

// Friend request system
export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  message?: string;
}

// Game history for completed games
export interface GameHistoryEntry {
  id: string;
  gameId: string;
  opponentId: string;
  opponentName: string;
  result: 'win' | 'loss' | 'draw';
  moveCount: number;
  playedAt: string; // ISO Date string
  scoreChange: number;
}

export interface OnlineData {
  currentUser: string | null; // ID of the logged-in user
  users: OnlineUser[];
  games: OnlineGame[];
  challenges: OnlineChallenge[];
  friendRequests: FriendRequest[];
  gameHistory: Record<string, GameHistoryEntry[]>; // userId -> array of history
}

// Helper types for UI
export interface FriendDisplay {
  id: string;
  username: string;
  isOnline: boolean;
  hasActiveGame: boolean;
  hasPendingChallenge: boolean;
  stats: PlayerStats;
  avatarColor: string;
  lastActive: string;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarColor: string;
  stats: PlayerStats;
  isFriend: boolean;
  isCurrentUser: boolean;
}

export type LeaderboardSortBy = 'score' | 'wins' | 'gamesPlayed' | 'winRatio';

// Challenge with full user info for UI
export interface ChallengeDisplay {
  id: string;
  fromUser: OnlineUser;
  toUser: OnlineUser;
  status: OnlineChallenge['status'];
  createdAt: string;
  message?: string;
  isIncoming: boolean;
}

// Friend request with full user info for UI
export interface FriendRequestDisplay {
  id: string;
  user: OnlineUser;
  status: FriendRequest['status'];
  createdAt: string;
  message?: string;
  isIncoming: boolean;
}
