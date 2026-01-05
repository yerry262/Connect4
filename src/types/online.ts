import { Player } from './game';

export interface OnlineUser {
  id: string;
  username: string;
  friends: string[]; // Array of user IDs
  isOnline: boolean;
}

export interface OnlineGame {
  id: string;
  players: [string, string]; // [Player1 ID, Player2 ID]
  currentTurn: string; // User ID whose turn it is
  board: (number | null)[][]; // 6x7 grid, 1 for P1, 2 for P2, null for empty
  status: 'active' | 'completed' | 'abandoned';
  winner?: string | null; // User ID or null for draw
  lastMove: string; // ISO Date string
}

export interface OnlineChallenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string; // ISO Date string
}

export interface OnlineData {
  currentUser: string | null; // ID of the logged-in user
  users: OnlineUser[];
  games: OnlineGame[];
  challenges: OnlineChallenge[];
}

// Helper types for UI
export interface FriendDisplay {
  id: string;
  username: string;
  isOnline: boolean;
  hasActiveGame: boolean;
  hasPendingChallenge: boolean;
}
