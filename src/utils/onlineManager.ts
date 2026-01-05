import { generateUsername, parseUsername } from './usernameGenerator';
import type { 
  OnlineData, 
  OnlineUser, 
  OnlineGame, 
  OnlineChallenge, 
  FriendDisplay 
} from '../types/online';
import initialData from '../GONLINEGAEMDATA.json';

const STORAGE_KEY = 'connect4_online_data_v1';

class OnlineManager {
  private data: OnlineData;
  private listeners: ((data: OnlineData) => void)[] = [];

  constructor() {
    this.data = this.loadData();
    if (!this.data.currentUser) {
      this.loginAsNewUser();
    }
  }

  private loadData(): OnlineData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with mock data if no local storage
    return initialData as unknown as OnlineData;
  }

  private saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.data));
  }

  public subscribe(listener: (data: OnlineData) => void) {
    this.listeners.push(listener);
    listener(this.data);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // --- User Management ---

  public getCurrentUser(): OnlineUser | null {
    if (!this.data.currentUser) return null;
    return this.data.users.find(u => u.id === this.data.currentUser) || null;
  }

  public loginAsNewUser() {
    const username = generateUsername();
    const parsed = parseUsername(username);
    const newUser: OnlineUser = {
      id: parsed ? parsed.id : Math.random().toString(36).substr(2, 9),
      username: username,
      friends: [],
      isOnline: true
    };
    
    this.data.users.push(newUser);
    this.data.currentUser = newUser.id;
    this.saveData();
    return newUser;
  }

  public getFriends(): FriendDisplay[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];

    const currentUser = this.data.users.find(u => u.id === currentUserId);
    if (!currentUser) return [];

    return currentUser.friends.map(friendId => {
      const friend = this.data.users.find(u => u.id === friendId);
      if (!friend) return null;

      const activeGame = this.data.games.find(g => 
        g.status === 'active' && 
        g.players.includes(currentUserId) && 
        g.players.includes(friendId)
      );

      const pendingChallenge = this.data.challenges.find(c => 
        c.status === 'pending' &&
        ((c.fromUserId === currentUserId && c.toUserId === friendId) ||
         (c.fromUserId === friendId && c.toUserId === currentUserId))
      );

      return {
        id: friend.id,
        username: friend.username,
        isOnline: friend.isOnline,
        hasActiveGame: !!activeGame,
        hasPendingChallenge: !!pendingChallenge
      };
    }).filter((f): f is FriendDisplay => f !== null);
  }

  public addFriend(username: string): boolean {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return false;

    const friend = this.data.users.find(u => u.username === username);
    if (!friend || friend.id === currentUserId) return false;

    const currentUser = this.data.users.find(u => u.id === currentUserId);
    if (!currentUser) return false;

    if (!currentUser.friends.includes(friend.id)) {
      currentUser.friends.push(friend.id);
      // Auto-add back for simplicity in this mock
      if (!friend.friends.includes(currentUserId)) {
        friend.friends.push(currentUserId);
      }
      this.saveData();
      return true;
    }
    return false;
  }

  public getUser(userId: string): OnlineUser | undefined {
    return this.data.users.find(u => u.id === userId);
  }

  public getPendingChallenges(): OnlineChallenge[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];
    return this.data.challenges.filter(c => c.status === 'pending' && c.toUserId === currentUserId);
  }

  // --- Challenge Management ---

  public sendChallenge(friendId: string) {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return;

    const challenge: OnlineChallenge = {
      id: Math.random().toString(36).substr(2, 9),
      fromUserId: currentUserId,
      toUserId: friendId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.data.challenges.push(challenge);
    this.saveData();
  }

  public acceptChallenge(challengeId: string) {
    const challenge = this.data.challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.status !== 'pending') return;

    challenge.status = 'accepted';

    // Create new game
    const newGame: OnlineGame = {
      id: Math.random().toString(36).substr(2, 9),
      players: [challenge.fromUserId, challenge.toUserId],
      currentTurn: challenge.fromUserId, // Challenger goes first? Or random? Let's say challenger.
      board: Array(6).fill(null).map(() => Array(7).fill(null)),
      status: 'active',
      lastMove: new Date().toISOString()
    };

    this.data.games.push(newGame);
    this.saveData();
    return newGame.id;
  }

  public declineChallenge(challengeId: string) {
    const challenge = this.data.challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.status = 'declined';
      this.saveData();
    }
  }

  // --- Game Management ---

  public getActiveGames(): OnlineGame[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];
    return this.data.games.filter(g => g.status === 'active' && g.players.includes(currentUserId));
  }

  public getGame(gameId: string): OnlineGame | undefined {
    return this.data.games.find(g => g.id === gameId);
  }

  public makeMove(gameId: string, col: number) {
    const game = this.data.games.find(g => g.id === gameId);
    if (!game || game.status !== 'active') return;

    const currentUserId = this.data.currentUser;
    if (game.currentTurn !== currentUserId) return; // Not your turn

    // Find lowest empty row
    let row = -1;
    for (let r = 5; r >= 0; r--) {
      if (game.board[r][col] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // Column full

    // 1 for Player 1, 2 for Player 2
    const playerIndex = game.players.indexOf(currentUserId);
    const playerNum = playerIndex + 1;

    game.board[row][col] = playerNum;
    game.lastMove = new Date().toISOString();

    // Check win (simplified check for now, or import game logic)
    if (this.checkWin(game.board, row, col, playerNum)) {
      game.status = 'completed';
      game.winner = currentUserId;
    } else if (this.checkDraw(game.board)) {
      game.status = 'completed';
      game.winner = null;
    } else {
      // Switch turn
      const nextPlayer = game.players.find(p => p !== currentUserId);
      if (nextPlayer) {
        game.currentTurn = nextPlayer;
      }
    }

    this.saveData();
  }

  // Helper to check win (copied/adapted from gameLogic)
  private checkWin(board: (number | null)[][], row: number, col: number, player: number): boolean {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal /
      [1, -1], // diagonal \
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || board[r][c] !== player) break;
        count++;
      }
      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || board[r][c] !== player) break;
        count++;
      }
      if (count >= 4) return true;
    }
    return false;
  }

  private checkDraw(board: (number | null)[][]): boolean {
    return board.every(row => row.every(cell => cell !== null));
  }
}

export const onlineManager = new OnlineManager();

