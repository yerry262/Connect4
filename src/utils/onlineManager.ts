import { generateUsername, parseUsername, getOrCreateUserId, getStoredUserId, storeUserId } from './usernameGenerator';
import type { 
  OnlineData, 
  OnlineUser, 
  OnlineGame, 
  OnlineChallenge, 
  FriendDisplay,
  PlayerStats,
  FriendRequest,
  GameHistoryEntry,
  LeaderboardEntry,
  LeaderboardSortBy,
  ChallengeDisplay,
  FriendRequestDisplay
} from '../types/online';

const STORAGE_KEY = 'connect4_online_data_v2';
const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#6C5CE7', '#FF8E53', '#A29BFE', '#FD79A8', '#00B894', '#E17055', '#74B9FF'];

function getDefaultStats(): PlayerStats {
  return {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    bestWinStreak: 0,
    score: 0,
    rank: 'Bronze',
    lastActive: new Date().toISOString()
  };
}

function calculateRank(stats: PlayerStats): PlayerStats['rank'] {
  const { score } = stats;
  if (score >= 10000) return 'Grandmaster';
  if (score >= 5000) return 'Master';
  if (score >= 2500) return 'Diamond';
  if (score >= 1000) return 'Platinum';
  if (score >= 500) return 'Gold';
  if (score >= 200) return 'Silver';
  return 'Bronze';
}

function calculateScore(wins: number, losses: number, draws: number): number {
  return Math.max(0, wins * 100 + draws * 25 - losses * 10);
}

function getInitialData(): OnlineData {
  // Create more interesting sample users
  const sampleUsers: OnlineUser[] = [
    {
      id: 'bot_1',
      username: 'ConnectMaster#2847',
      friends: [],
      isOnline: true,
      stats: { ...getDefaultStats(), gamesPlayed: 156, wins: 102, losses: 42, draws: 12, score: 9530, winStreak: 5, bestWinStreak: 12, rank: 'Master' },
      avatarColor: '#6C5CE7',
      bio: 'The original Connect4 champion 🏆',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 'bot_2',
      username: 'QuickDrop#7721',
      friends: [],
      isOnline: true,
      stats: { ...getDefaultStats(), gamesPlayed: 89, wins: 45, losses: 38, draws: 6, score: 4120, winStreak: 2, bestWinStreak: 7, rank: 'Platinum' },
      avatarColor: '#4ECDC4',
      bio: 'Speed is my strategy!',
      createdAt: '2024-03-10T00:00:00Z'
    },
    {
      id: 'bot_3',
      username: 'FourInARow#4444',
      friends: [],
      isOnline: false,
      stats: { ...getDefaultStats(), gamesPlayed: 234, wins: 167, losses: 52, draws: 15, score: 15855, winStreak: 0, bestWinStreak: 18, rank: 'Grandmaster' },
      avatarColor: '#FF6B6B',
      bio: 'Former world champion. Retired legend.',
      createdAt: '2023-06-01T00:00:00Z'
    },
    {
      id: 'bot_4',
      username: 'StrategyKing#9012',
      friends: [],
      isOnline: true,
      stats: { ...getDefaultStats(), gamesPlayed: 67, wins: 41, losses: 21, draws: 5, score: 3815, winStreak: 8, bestWinStreak: 8, rank: 'Platinum' },
      avatarColor: '#FF8E53',
      bio: 'Every move counts.',
      createdAt: '2024-05-20T00:00:00Z'
    },
    {
      id: 'bot_5',
      username: 'CasualPlayer#1234',
      friends: [],
      isOnline: false,
      stats: { ...getDefaultStats(), gamesPlayed: 23, wins: 8, losses: 12, draws: 3, score: 555, winStreak: 0, bestWinStreak: 3, rank: 'Gold' },
      avatarColor: '#00B894',
      bio: 'Just here for fun!',
      createdAt: '2024-08-15T00:00:00Z'
    },
    {
      id: 'bot_6',
      username: 'NewChallenger#5678',
      friends: [],
      isOnline: true,
      stats: { ...getDefaultStats(), gamesPlayed: 5, wins: 3, losses: 2, draws: 0, score: 280, winStreak: 1, bestWinStreak: 2, rank: 'Silver' },
      avatarColor: '#74B9FF',
      bio: 'Learning the ropes',
      createdAt: '2025-12-01T00:00:00Z'
    },
    {
      id: 'bot_7',
      username: 'DiagonalDemon#3333',
      friends: [],
      isOnline: true,
      stats: { ...getDefaultStats(), gamesPlayed: 112, wins: 78, losses: 28, draws: 6, score: 7370, winStreak: 4, bestWinStreak: 11, rank: 'Diamond' },
      avatarColor: '#E17055',
      bio: 'I always go diagonal 🔥',
      createdAt: '2024-02-20T00:00:00Z'
    },
    {
      id: 'bot_8',
      username: 'ColumnKing#8888',
      friends: [],
      isOnline: false,
      stats: { ...getDefaultStats(), gamesPlayed: 45, wins: 22, losses: 18, draws: 5, score: 1945, winStreak: 0, bestWinStreak: 5, rank: 'Platinum' },
      avatarColor: '#FD79A8',
      bio: 'Center column is the key.',
      createdAt: '2024-07-10T00:00:00Z'
    }
  ];

  return {
    currentUser: null,
    users: sampleUsers,
    games: [],
    challenges: [],
    friendRequests: [],
    gameHistory: {}
  };
}

class OnlineManager {
  private data: OnlineData;
  private listeners: ((data: OnlineData) => void)[] = [];

  constructor() {
    this.data = this.loadData();
    // Migrate old data if needed
    this.migrateData();
    // Ensure we have a current user (sync for immediate use)
    if (!this.data.currentUser) {
      // Check if we have a stored user ID first
      const storedId = getStoredUserId();
      if (storedId) {
        const existingUser = this.data.users.find(u => u.id === storedId);
        if (existingUser) {
          this.data.currentUser = existingUser.id;
          this.saveData();
        } else {
          // Create user with stored ID
          this.loginAsNewUser();
        }
      } else {
        // No stored ID, create new user
        this.loginAsNewUser();
      }
    }
    // Upgrade to fingerprint-based ID asynchronously (for future visits)
    this.upgradeToFingerprintId();
  }

  // Upgrade user ID to fingerprint-based (runs in background, doesn't block)
  private async upgradeToFingerprintId() {
    try {
      await getOrCreateUserId();
      // Fingerprint ID is now stored for future use
    } catch {
      // Fingerprint generation failed, continue with random ID
    }
  }

  private migrateData() {
    // Ensure all required fields exist
    if (!this.data.friendRequests) {
      this.data.friendRequests = [];
    }
    if (!this.data.gameHistory) {
      this.data.gameHistory = {};
    }
    
    // Migrate users to have stats
    this.data.users = this.data.users.map(user => ({
      ...user,
      stats: user.stats || getDefaultStats(),
      avatarColor: user.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      bio: user.bio || '',
      createdAt: user.createdAt || new Date().toISOString()
    }));

    // Migrate games to have new fields
    this.data.games = this.data.games.map(game => ({
      ...game,
      createdAt: game.createdAt || game.lastMove,
      moveCount: game.moveCount || 0
    }));

    this.saveData();
  }

  private loadData(): OnlineData {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return getInitialData();
      }
    }
    return getInitialData();
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

  public loginAsNewUser(): OnlineUser {
    const username = generateUsername();
    const parsed = parseUsername(username);
    const newUserId = parsed ? `user_${parsed.id}_${Date.now().toString(36)}` : `user_${Math.random().toString(36).substr(2, 9)}`;
    
    const newUser: OnlineUser = {
      id: newUserId,
      username: username,
      friends: [],
      isOnline: true,
      stats: getDefaultStats(),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      bio: 'Ready to connect four!',
      createdAt: new Date().toISOString()
    };
    
    // Store user ID for persistence
    storeUserId(newUserId);
    
    this.data.users.push(newUser);
    this.data.currentUser = newUser.id;
    this.data.gameHistory[newUser.id] = [];
    this.saveData();
    return newUser;
  }

  public updateProfile(updates: { username?: string; bio?: string; avatarColor?: string }): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const userIndex = this.data.users.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) return false;

    if (updates.username && updates.username !== currentUser.username) {
      // Check if username is taken
      const existing = this.data.users.find(u => u.username === updates.username && u.id !== currentUser.id);
      if (existing) return false;
      this.data.users[userIndex].username = updates.username;
    }

    if (updates.bio !== undefined) {
      this.data.users[userIndex].bio = updates.bio;
    }

    if (updates.avatarColor) {
      this.data.users[userIndex].avatarColor = updates.avatarColor;
    }

    this.data.users[userIndex].stats.lastActive = new Date().toISOString();
    this.saveData();
    return true;
  }

  // --- Friends Management ---

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
        hasPendingChallenge: !!pendingChallenge,
        stats: friend.stats,
        avatarColor: friend.avatarColor,
        lastActive: friend.stats.lastActive
      };
    }).filter((f): f is FriendDisplay => f !== null)
      .sort((a, b) => {
        // Online friends first
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        // Then by score
        return b.stats.score - a.stats.score;
      });
  }

  public removeFriend(friendId: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const userIndex = this.data.users.findIndex(u => u.id === currentUser.id);
    const friendIndex = this.data.users.findIndex(u => u.id === friendId);

    if (userIndex === -1 || friendIndex === -1) return false;

    // Remove from both users' friend lists
    this.data.users[userIndex].friends = this.data.users[userIndex].friends.filter(id => id !== friendId);
    this.data.users[friendIndex].friends = this.data.users[friendIndex].friends.filter(id => id !== currentUser.id);

    this.saveData();
    return true;
  }

  // --- Friend Requests ---

  public sendFriendRequest(toUserId: string, message?: string): boolean {
    const currentUserId = this.data.currentUser;
    if (!currentUserId || currentUserId === toUserId) return false;

    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.friends.includes(toUserId)) return false;

    // Check if request already exists
    const existing = this.data.friendRequests.find(r =>
      r.status === 'pending' &&
      ((r.fromUserId === currentUserId && r.toUserId === toUserId) ||
       (r.fromUserId === toUserId && r.toUserId === currentUserId))
    );
    if (existing) return false;

    const request: FriendRequest = {
      id: Math.random().toString(36).substr(2, 9),
      fromUserId: currentUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      message
    };

    this.data.friendRequests.push(request);
    this.saveData();
    return true;
  }

  public acceptFriendRequest(requestId: string): boolean {
    const request = this.data.friendRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return false;

    const currentUserId = this.data.currentUser;
    if (request.toUserId !== currentUserId) return false;

    // Update request status
    request.status = 'accepted';

    // Add to both users' friend lists
    const currentUser = this.data.users.find(u => u.id === currentUserId);
    const fromUser = this.data.users.find(u => u.id === request.fromUserId);

    if (currentUser && fromUser) {
      if (!currentUser.friends.includes(request.fromUserId)) {
        currentUser.friends.push(request.fromUserId);
      }
      if (!fromUser.friends.includes(currentUserId!)) {
        fromUser.friends.push(currentUserId!);
      }
    }

    this.saveData();
    return true;
  }

  public declineFriendRequest(requestId: string): boolean {
    const request = this.data.friendRequests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'declined';
    this.saveData();
    return true;
  }

  public getIncomingFriendRequests(): FriendRequestDisplay[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];

    const results: FriendRequestDisplay[] = [];
    for (const r of this.data.friendRequests) {
      if (r.status === 'pending' && r.toUserId === currentUserId) {
        const user = this.data.users.find(u => u.id === r.fromUserId);
        if (user) {
          results.push({
            id: r.id,
            user,
            status: r.status,
            createdAt: r.createdAt,
            message: r.message,
            isIncoming: true
          });
        }
      }
    }
    return results;
  }

  public getOutgoingFriendRequests(): FriendRequestDisplay[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];

    const results: FriendRequestDisplay[] = [];
    for (const r of this.data.friendRequests) {
      if (r.status === 'pending' && r.fromUserId === currentUserId) {
        const user = this.data.users.find(u => u.id === r.toUserId);
        if (user) {
          results.push({
            id: r.id,
            user,
            status: r.status,
            createdAt: r.createdAt,
            message: r.message,
            isIncoming: false
          });
        }
      }
    }
    return results;
  }

  public cancelFriendRequest(requestId: string): boolean {
    const requestIndex = this.data.friendRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return false;

    const request = this.data.friendRequests[requestIndex];
    if (request.fromUserId !== this.data.currentUser) return false;

    this.data.friendRequests.splice(requestIndex, 1);
    this.saveData();
    return true;
  }

  // --- Legacy friend add for compatibility ---
  public addFriend(username: string): boolean {
    const friend = this.data.users.find(u => u.username === username);
    if (!friend) return false;
    return this.sendFriendRequest(friend.id);
  }

  public getUser(userId: string): OnlineUser | undefined {
    return this.data.users.find(u => u.id === userId);
  }

  public searchUsers(query: string): OnlineUser[] {
    const currentUserId = this.data.currentUser;
    const lowerQuery = query.toLowerCase();
    return this.data.users.filter(u => 
      u.id !== currentUserId && 
      u.username.toLowerCase().includes(lowerQuery)
    ).slice(0, 20); // Limit results
  }

  // --- Challenge Management ---

  public getPendingChallenges(): OnlineChallenge[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];
    return this.data.challenges.filter(c => c.status === 'pending' && c.toUserId === currentUserId);
  }

  public getIncomingChallenges(): ChallengeDisplay[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];

    const results: ChallengeDisplay[] = [];
    for (const c of this.data.challenges) {
      if (c.status === 'pending' && c.toUserId === currentUserId) {
        const fromUser = this.data.users.find(u => u.id === c.fromUserId);
        const toUser = this.data.users.find(u => u.id === c.toUserId);
        if (fromUser && toUser) {
          results.push({
            id: c.id,
            fromUser,
            toUser,
            status: c.status,
            createdAt: c.createdAt,
            message: c.message,
            isIncoming: true
          });
        }
      }
    }
    return results;
  }

  public getOutgoingChallenges(): ChallengeDisplay[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];

    const results: ChallengeDisplay[] = [];
    for (const c of this.data.challenges) {
      if (c.status === 'pending' && c.fromUserId === currentUserId) {
        const fromUser = this.data.users.find(u => u.id === c.fromUserId);
        const toUser = this.data.users.find(u => u.id === c.toUserId);
        if (fromUser && toUser) {
          results.push({
            id: c.id,
            fromUser,
            toUser,
            status: c.status,
            createdAt: c.createdAt,
            message: c.message,
            isIncoming: false
          });
        }
      }
    }
    return results;
  }

  public sendChallenge(friendId: string, message?: string) {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return;

    // Check if there's already a pending challenge
    const existing = this.data.challenges.find(c =>
      c.status === 'pending' &&
      ((c.fromUserId === currentUserId && c.toUserId === friendId) ||
       (c.fromUserId === friendId && c.toUserId === currentUserId))
    );
    if (existing) return;

    const challenge: OnlineChallenge = {
      id: Math.random().toString(36).substr(2, 9),
      fromUserId: currentUserId,
      toUserId: friendId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      message
    };

    this.data.challenges.push(challenge);
    this.saveData();
  }

  public acceptChallenge(challengeId: string): string | undefined {
    const challenge = this.data.challenges.find(c => c.id === challengeId);
    if (!challenge || challenge.status !== 'pending') return;

    challenge.status = 'accepted';

    // Create new game
    const newGame: OnlineGame = {
      id: Math.random().toString(36).substr(2, 9),
      players: [challenge.fromUserId, challenge.toUserId],
      currentTurn: challenge.fromUserId, // Challenger goes first
      board: Array(6).fill(null).map(() => Array(7).fill(null)),
      status: 'active',
      lastMove: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      moveCount: 0
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

  public cancelChallenge(challengeId: string): boolean {
    const challengeIndex = this.data.challenges.findIndex(c => c.id === challengeId);
    if (challengeIndex === -1) return false;

    const challenge = this.data.challenges[challengeIndex];
    if (challenge.fromUserId !== this.data.currentUser) return false;

    this.data.challenges.splice(challengeIndex, 1);
    this.saveData();
    return true;
  }

  // --- Game Management ---

  public getActiveGames(): OnlineGame[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];
    return this.data.games
      .filter(g => g.status === 'active' && g.players.includes(currentUserId))
      .sort((a, b) => {
        // Games where it's your turn first
        const aMyTurn = a.currentTurn === currentUserId;
        const bMyTurn = b.currentTurn === currentUserId;
        if (aMyTurn !== bMyTurn) return aMyTurn ? -1 : 1;
        // Then by last move date
        return new Date(b.lastMove).getTime() - new Date(a.lastMove).getTime();
      });
  }

  public getCompletedGames(): OnlineGame[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];
    return this.data.games
      .filter(g => g.status === 'completed' && g.players.includes(currentUserId))
      .sort((a, b) => new Date(b.lastMove).getTime() - new Date(a.lastMove).getTime())
      .slice(0, 50); // Last 50 games
  }

  public getGameHistory(): GameHistoryEntry[] {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return [];
    return this.data.gameHistory[currentUserId] || [];
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
    const playerIndex = game.players.indexOf(currentUserId!);
    const playerNum = playerIndex + 1;

    game.board[row][col] = playerNum;
    game.lastMove = new Date().toISOString();
    game.moveCount++;

    // Check win
    const winResult = this.checkWinWithLine(game.board, row, col, playerNum);
    if (winResult) {
      game.status = 'completed';
      game.winner = currentUserId;
      game.winningLine = winResult;
      this.recordGameResult(game);
    } else if (this.checkDraw(game.board)) {
      game.status = 'completed';
      game.winner = null;
      this.recordGameResult(game);
    } else {
      // Switch turn
      const nextPlayer = game.players.find(p => p !== currentUserId);
      if (nextPlayer) {
        game.currentTurn = nextPlayer;
      }
    }

    this.saveData();
  }

  private recordGameResult(game: OnlineGame) {
    const [player1Id, player2Id] = game.players;
    const player1 = this.data.users.find(u => u.id === player1Id);
    const player2 = this.data.users.find(u => u.id === player2Id);

    if (!player1 || !player2) return;

    // Update stats
    player1.stats.gamesPlayed++;
    player2.stats.gamesPlayed++;
    player1.stats.lastActive = new Date().toISOString();
    player2.stats.lastActive = new Date().toISOString();

    let p1Result: 'win' | 'loss' | 'draw';
    let p2Result: 'win' | 'loss' | 'draw';
    let p1ScoreChange: number;
    let p2ScoreChange: number;

    if (game.winner === null) {
      // Draw
      player1.stats.draws++;
      player2.stats.draws++;
      player1.stats.winStreak = 0;
      player2.stats.winStreak = 0;
      p1Result = 'draw';
      p2Result = 'draw';
      p1ScoreChange = 25;
      p2ScoreChange = 25;
    } else if (game.winner === player1Id) {
      player1.stats.wins++;
      player1.stats.winStreak++;
      if (player1.stats.winStreak > player1.stats.bestWinStreak) {
        player1.stats.bestWinStreak = player1.stats.winStreak;
      }
      player2.stats.losses++;
      player2.stats.winStreak = 0;
      p1Result = 'win';
      p2Result = 'loss';
      p1ScoreChange = 100;
      p2ScoreChange = -10;
    } else {
      player2.stats.wins++;
      player2.stats.winStreak++;
      if (player2.stats.winStreak > player2.stats.bestWinStreak) {
        player2.stats.bestWinStreak = player2.stats.winStreak;
      }
      player1.stats.losses++;
      player1.stats.winStreak = 0;
      p1Result = 'loss';
      p2Result = 'win';
      p1ScoreChange = -10;
      p2ScoreChange = 100;
    }

    // Update scores
    player1.stats.score = calculateScore(player1.stats.wins, player1.stats.losses, player1.stats.draws);
    player2.stats.score = calculateScore(player2.stats.wins, player2.stats.losses, player2.stats.draws);

    // Update ranks
    player1.stats.rank = calculateRank(player1.stats);
    player2.stats.rank = calculateRank(player2.stats);

    // Record game history
    if (!this.data.gameHistory[player1Id]) {
      this.data.gameHistory[player1Id] = [];
    }
    if (!this.data.gameHistory[player2Id]) {
      this.data.gameHistory[player2Id] = [];
    }

    this.data.gameHistory[player1Id].unshift({
      id: Math.random().toString(36).substr(2, 9),
      gameId: game.id,
      opponentId: player2Id,
      opponentName: player2.username,
      result: p1Result,
      moveCount: game.moveCount,
      playedAt: new Date().toISOString(),
      scoreChange: p1ScoreChange
    });

    this.data.gameHistory[player2Id].unshift({
      id: Math.random().toString(36).substr(2, 9),
      gameId: game.id,
      opponentId: player1Id,
      opponentName: player1.username,
      result: p2Result,
      moveCount: game.moveCount,
      playedAt: new Date().toISOString(),
      scoreChange: p2ScoreChange
    });

    // Keep only last 100 games in history
    this.data.gameHistory[player1Id] = this.data.gameHistory[player1Id].slice(0, 100);
    this.data.gameHistory[player2Id] = this.data.gameHistory[player2Id].slice(0, 100);
  }

  public abandonGame(gameId: string): boolean {
    const game = this.data.games.find(g => g.id === gameId);
    if (!game || game.status !== 'active') return false;

    const currentUserId = this.data.currentUser;
    if (!game.players.includes(currentUserId!)) return false;

    // Abandoning counts as a loss
    game.status = 'abandoned';
    const opponentId = game.players.find(p => p !== currentUserId);
    game.winner = opponentId || null;

    // Record as a loss for the abandoning player
    if (opponentId) {
      const tempWinner = game.winner;
      this.recordGameResult(game);
      game.winner = tempWinner;
    }

    this.saveData();
    return true;
  }

  // --- Leaderboards ---

  public getLeaderboard(sortBy: LeaderboardSortBy = 'score', limit: number = 50): LeaderboardEntry[] {
    const currentUserId = this.data.currentUser;
    const currentUser = this.getCurrentUser();

    let sorted = [...this.data.users];

    switch (sortBy) {
      case 'wins':
        sorted.sort((a, b) => b.stats.wins - a.stats.wins);
        break;
      case 'gamesPlayed':
        sorted.sort((a, b) => b.stats.gamesPlayed - a.stats.gamesPlayed);
        break;
      case 'winRatio':
        sorted.sort((a, b) => {
          const ratioA = a.stats.gamesPlayed > 0 ? a.stats.wins / a.stats.gamesPlayed : 0;
          const ratioB = b.stats.gamesPlayed > 0 ? b.stats.wins / b.stats.gamesPlayed : 0;
          return ratioB - ratioA;
        });
        break;
      case 'score':
      default:
        sorted.sort((a, b) => b.stats.score - a.stats.score);
        break;
    }

    return sorted.slice(0, limit).map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      avatarColor: user.avatarColor,
      stats: user.stats,
      isFriend: currentUser?.friends.includes(user.id) || false,
      isCurrentUser: user.id === currentUserId
    }));
  }

  public getFriendsLeaderboard(sortBy: LeaderboardSortBy = 'score'): LeaderboardEntry[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];

    const friendsAndSelf = [currentUser.id, ...currentUser.friends];
    const friends = this.data.users.filter(u => friendsAndSelf.includes(u.id));

    let sorted = [...friends];

    switch (sortBy) {
      case 'wins':
        sorted.sort((a, b) => b.stats.wins - a.stats.wins);
        break;
      case 'gamesPlayed':
        sorted.sort((a, b) => b.stats.gamesPlayed - a.stats.gamesPlayed);
        break;
      case 'winRatio':
        sorted.sort((a, b) => {
          const ratioA = a.stats.gamesPlayed > 0 ? a.stats.wins / a.stats.gamesPlayed : 0;
          const ratioB = b.stats.gamesPlayed > 0 ? b.stats.wins / b.stats.gamesPlayed : 0;
          return ratioB - ratioA;
        });
        break;
      case 'score':
      default:
        sorted.sort((a, b) => b.stats.score - a.stats.score);
        break;
    }

    return sorted.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      avatarColor: user.avatarColor,
      stats: user.stats,
      isFriend: currentUser.friends.includes(user.id),
      isCurrentUser: user.id === currentUser.id
    }));
  }

  // --- Stats Helpers ---

  public getWinRatio(userId: string): number {
    const user = this.data.users.find(u => u.id === userId);
    if (!user || user.stats.gamesPlayed === 0) return 0;
    return Math.round((user.stats.wins / user.stats.gamesPlayed) * 100);
  }

  public getHeadToHead(opponentId: string): { wins: number; losses: number; draws: number } {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return { wins: 0, losses: 0, draws: 0 };

    const history = this.data.gameHistory[currentUserId] || [];
    const vsOpponent = history.filter(h => h.opponentId === opponentId);

    return {
      wins: vsOpponent.filter(h => h.result === 'win').length,
      losses: vsOpponent.filter(h => h.result === 'loss').length,
      draws: vsOpponent.filter(h => h.result === 'draw').length
    };
  }

  // --- Notification counts ---

  public getNotificationCounts(): { friendRequests: number; challenges: number; yourTurn: number } {
    const currentUserId = this.data.currentUser;
    if (!currentUserId) return { friendRequests: 0, challenges: 0, yourTurn: 0 };

    return {
      friendRequests: this.data.friendRequests.filter(r => r.status === 'pending' && r.toUserId === currentUserId).length,
      challenges: this.data.challenges.filter(c => c.status === 'pending' && c.toUserId === currentUserId).length,
      yourTurn: this.data.games.filter(g => g.status === 'active' && g.currentTurn === currentUserId).length
    };
  }

  // --- Win checking helpers ---

  private checkWinWithLine(board: (number | null)[][], row: number, col: number, player: number): [number, number][] | null {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal /
      [1, -1], // diagonal \
    ];

    for (const [dr, dc] of directions) {
      const line: [number, number][] = [[row, col]];
      
      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || board[r][c] !== player) break;
        line.push([r, c]);
      }
      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= 6 || c < 0 || c >= 7 || board[r][c] !== player) break;
        line.push([r, c]);
      }
      if (line.length >= 4) return line;
    }
    return null;
  }

  private checkDraw(board: (number | null)[][]): boolean {
    return board.every(row => row.every(cell => cell !== null));
  }

  // --- Debug / Reset ---

  public resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = getInitialData();
    this.loginAsNewUser();
  }
}

export const onlineManager = new OnlineManager();
