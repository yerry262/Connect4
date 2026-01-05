import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, Typography, Paper, List, ListItem, ListItemText, 
  ListItemSecondaryAction, IconButton, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Badge, Divider, Tabs, Tab, Card, CardContent, CardActions,
  Avatar, Select, MenuItem, FormControl, InputLabel, Tooltip,
  InputAdornment, ListItemAvatar, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { 
  PersonAdd, PlayArrow, Check, Close, SportsEsports, 
  Circle, EmojiEvents, Search, Send, ExpandMore,
  Leaderboard, History, Group, Mail, Stars, Visibility, Edit, Save
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { onlineManager } from '../utils/onlineManager';
import type { 
  OnlineUser, FriendDisplay, OnlineGame, 
  LeaderboardEntry, LeaderboardSortBy, ChallengeDisplay, FriendRequestDisplay,
  GameHistoryEntry
} from '../types/online';

interface OnlineDashboardProps {
  onStartGame: (gameId: string) => void;
  onClose: () => void;
}

// Avatar component with rank badge
const PlayerAvatar: React.FC<{ user: { username: string; avatarColor: string; stats?: { rank: string } }; size?: number }> = ({ user, size = 40 }) => {
  const getRankColor = (rank?: string) => {
    switch (rank) {
      case 'Grandmaster': return '#FFD700';
      case 'Master': return '#E040FB';
      case 'Diamond': return '#00BCD4';
      case 'Platinum': return '#78909C';
      case 'Gold': return '#FFC107';
      case 'Silver': return '#9E9E9E';
      default: return '#8D6E63';
    }
  };

  return (
    <Tooltip title={user.stats?.rank || 'Bronze'}>
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: getRankColor(user.stats?.rank),
              border: '2px solid #1a1a2e'
            }}
          />
        }
      >
        <Avatar sx={{ bgcolor: user.avatarColor, width: size, height: size, fontSize: size * 0.4 }}>
          {user.username.charAt(0).toUpperCase()}
        </Avatar>
      </Badge>
    </Tooltip>
  );
};

// Stats display component
interface StatsData {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  score: number;
  winStreak: number;
  bestWinStreak: number;
}

const StatsDisplay: React.FC<{ stats: StatsData; compact?: boolean }> = ({ stats, compact }) => {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;
  
  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip size="small" icon={<EmojiEvents sx={{ fontSize: 14 }} />} label={`${stats.wins}W`} color="success" variant="outlined" />
        <Chip size="small" label={`${stats.losses}L`} color="error" variant="outlined" />
        <Chip size="small" label={`${winRate}%`} variant="outlined" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
      <Box>
        <Typography variant="caption" color="text.secondary">Score</Typography>
        <Typography variant="h6" color="primary">{stats.score.toLocaleString()}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Win Rate</Typography>
        <Typography variant="h6">{winRate}%</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">W/L/D</Typography>
        <Typography variant="body1">{stats.wins}/{stats.losses}/{stats.draws}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">Win Streak</Typography>
        <Typography variant="body1">🔥 {stats.winStreak} (Best: {stats.bestWinStreak})</Typography>
      </Box>
    </Box>
  );
};

export const OnlineDashboard: React.FC<OnlineDashboardProps> = ({ onStartGame, onClose }) => {
  // Initialize state with values directly from onlineManager
  const [currentUser, setCurrentUser] = useState<OnlineUser | null>(() => onlineManager.getCurrentUser());
  const [friends, setFriends] = useState<FriendDisplay[]>(() => onlineManager.getFriends());
  const [activeGames, setActiveGames] = useState<OnlineGame[]>(() => onlineManager.getActiveGames());
  const [incomingChallenges, setIncomingChallenges] = useState<ChallengeDisplay[]>(() => onlineManager.getIncomingChallenges());
  const [outgoingChallenges, setOutgoingChallenges] = useState<ChallengeDisplay[]>(() => onlineManager.getOutgoingChallenges());
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<FriendRequestDisplay[]>(() => onlineManager.getIncomingFriendRequests());
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<FriendRequestDisplay[]>(() => onlineManager.getOutgoingFriendRequests());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => onlineManager.getLeaderboard('score'));
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>(() => onlineManager.getFriendsLeaderboard('score'));
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>(() => onlineManager.getGameHistory());
  const [notificationCounts, setNotificationCounts] = useState(() => onlineManager.getNotificationCounts());
  
  const [tabValue, setTabValue] = useState(0);
  const [leaderboardSort, setLeaderboardSort] = useState<LeaderboardSortBy>('score');
  const [leaderboardType, setLeaderboardType] = useState<'global' | 'friends'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [challengeMessage, setChallengeMessage] = useState('');
  const [friendRequestMessage, setFriendRequestMessage] = useState('');
  
  // Dialogs
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedFriendForChallenge, setSelectedFriendForChallenge] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [viewProfileUser, setViewProfileUser] = useState<OnlineUser | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatarColor, setEditAvatarColor] = useState('');

  const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#6C5CE7', '#FF8E53', '#A29BFE', '#FD79A8', '#00B894', '#E17055', '#74B9FF'];

  const updateState = useCallback(() => {
    setCurrentUser(onlineManager.getCurrentUser());
    setFriends(onlineManager.getFriends());
    setActiveGames(onlineManager.getActiveGames());
    setIncomingChallenges(onlineManager.getIncomingChallenges());
    setOutgoingChallenges(onlineManager.getOutgoingChallenges());
    setIncomingFriendRequests(onlineManager.getIncomingFriendRequests());
    setOutgoingFriendRequests(onlineManager.getOutgoingFriendRequests());
    setLeaderboard(onlineManager.getLeaderboard(leaderboardSort));
    setFriendsLeaderboard(onlineManager.getFriendsLeaderboard(leaderboardSort));
    setGameHistory(onlineManager.getGameHistory());
    setNotificationCounts(onlineManager.getNotificationCounts());
  }, [leaderboardSort]);

  useEffect(() => {
    // Subscribe to updates from onlineManager
    const unsubscribe = onlineManager.subscribe(updateState);
    return unsubscribe;
  }, [updateState]);

  // Use useMemo for search results instead of useEffect + setState
  const searchResults = useMemo(() => {
    if (searchQuery.length >= 2) {
      return onlineManager.searchUsers(searchQuery);
    }
    return [];
  }, [searchQuery]);

  const handleSendFriendRequest = (userId: string) => {
    onlineManager.sendFriendRequest(userId, friendRequestMessage || undefined);
    setFriendRequestMessage('');
    setSearchQuery('');
  };

  const handleAcceptFriendRequest = (requestId: string) => {
    onlineManager.acceptFriendRequest(requestId);
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    onlineManager.declineFriendRequest(requestId);
  };

  const handleCancelFriendRequest = (requestId: string) => {
    onlineManager.cancelFriendRequest(requestId);
  };

  const handleChallenge = (friendId: string) => {
    setSelectedFriendForChallenge(friendId);
    setChallengeDialogOpen(true);
  };

  const handleSendChallenge = () => {
    if (selectedFriendForChallenge) {
      onlineManager.sendChallenge(selectedFriendForChallenge, challengeMessage || undefined);
      setChallengeDialogOpen(false);
      setChallengeMessage('');
      setSelectedFriendForChallenge(null);
    }
  };

  const handleAcceptChallenge = (challengeId: string) => {
    const gameId = onlineManager.acceptChallenge(challengeId);
    if (gameId) {
      onStartGame(gameId);
    }
  };

  const handleDeclineChallenge = (challengeId: string) => {
    onlineManager.declineChallenge(challengeId);
  };

  const handleCancelChallenge = (challengeId: string) => {
    onlineManager.cancelChallenge(challengeId);
  };

  const handleViewProfile = (user: OnlineUser) => {
    setViewProfileUser(user);
    setProfileDialogOpen(true);
  };

  const handleEditProfile = () => {
    if (currentUser) {
      setEditBio(currentUser.bio);
      setEditAvatarColor(currentUser.avatarColor);
      setEditingProfile(true);
    }
  };

  const handleSaveProfile = () => {
    onlineManager.updateProfile({ bio: editBio, avatarColor: editAvatarColor });
    setEditingProfile(false);
  };

  const getOpponentName = (game: OnlineGame) => {
    const opponentId = game.players.find(p => p !== currentUser?.id);
    if (!opponentId) return 'Unknown';
    const user = onlineManager.getUser(opponentId);
    return user ? user.username : opponentId;
  };

  const getOpponent = (game: OnlineGame): OnlineUser | undefined => {
    const opponentId = game.players.find(p => p !== currentUser?.id);
    if (!opponentId) return undefined;
    return onlineManager.getUser(opponentId);
  };

  const totalNotifications = notificationCounts.friendRequests + notificationCounts.challenges + notificationCounts.yourTurn;

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        maxWidth: 800, 
        mx: 'auto', 
        mt: 2, 
        maxHeight: '90vh', 
        overflow: 'auto',
        bgcolor: 'rgba(26, 26, 46, 0.95)',
        color: 'white',
        borderRadius: 3
      }}
    >
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SportsEsports /> Online Hub
          {totalNotifications > 0 && (
            <Badge badgeContent={totalNotifications} color="error" sx={{ ml: 1 }} />
          )}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}><Close /></IconButton>
      </Box>

      {/* Current User Profile Card */}
      {currentUser && (
        <Card sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <PlayerAvatar user={currentUser} size={60} />
              <Box flex={1}>
                <Typography variant="h5">{currentUser.username}</Typography>
                <Typography variant="body2" color="text.secondary">{currentUser.bio}</Typography>
                <Chip 
                  label={currentUser.stats.rank} 
                  size="small" 
                  sx={{ mt: 0.5 }}
                  icon={<Stars sx={{ fontSize: 14 }} />}
                />
              </Box>
              <Box textAlign="right">
                <Typography variant="h4" color="primary">{currentUser.stats.score.toLocaleString()}</Typography>
                <Typography variant="caption" color="text.secondary">Total Score</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
            <StatsDisplay stats={currentUser.stats} />
          </CardContent>
          <CardActions>
            <Button size="small" startIcon={<Edit />} onClick={handleEditProfile}>
              Edit Profile
            </Button>
          </CardActions>
        </Card>
      )}

      {/* Notification Badges */}
      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
        {notificationCounts.yourTurn > 0 && (
          <Chip 
            icon={<PlayArrow />} 
            label={`${notificationCounts.yourTurn} game${notificationCounts.yourTurn > 1 ? 's' : ''} - Your Turn!`} 
            color="primary" 
            onClick={() => setTabValue(2)}
          />
        )}
        {notificationCounts.challenges > 0 && (
          <Chip 
            icon={<SportsEsports />} 
            label={`${notificationCounts.challenges} challenge${notificationCounts.challenges > 1 ? 's' : ''}`} 
            color="secondary" 
            onClick={() => setTabValue(1)}
          />
        )}
        {notificationCounts.friendRequests > 0 && (
          <Chip 
            icon={<PersonAdd />} 
            label={`${notificationCounts.friendRequests} friend request${notificationCounts.friendRequests > 1 ? 's' : ''}`} 
            color="info" 
            onClick={() => setTabValue(0)}
          />
        )}
      </Box>

      {/* Main Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={(_, v) => setTabValue(v)} 
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab icon={<Badge badgeContent={notificationCounts.friendRequests} color="error"><Group /></Badge>} label="Friends" />
        <Tab icon={<Badge badgeContent={notificationCounts.challenges} color="error"><Mail /></Badge>} label="Invites" />
        <Tab icon={<Badge badgeContent={notificationCounts.yourTurn} color="error"><SportsEsports /></Badge>} label="Games" />
        <Tab icon={<Leaderboard />} label="Leaderboards" />
        <Tab icon={<History />} label="History" />
      </Tabs>

      {/* Tab 0: Friends */}
      {tabValue === 0 && (
        <Box>
          {/* Incoming Friend Requests */}
          {incomingFriendRequests.length > 0 && (
            <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography>
                  <Badge badgeContent={incomingFriendRequests.length} color="primary" sx={{ mr: 2 }}>
                    <PersonAdd />
                  </Badge>
                  Friend Requests
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {incomingFriendRequests.map(req => (
                    <ListItem key={req.id}>
                      <ListItemAvatar>
                        <PlayerAvatar user={req.user} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={req.user.username}
                        secondary={req.message || `Wants to be friends • ${req.user.stats.rank}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton color="success" onClick={() => handleAcceptFriendRequest(req.id)}>
                          <Check />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDeclineFriendRequest(req.id)}>
                          <Close />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Outgoing Friend Requests */}
          {outgoingFriendRequests.length > 0 && (
            <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore sx={{ color: 'white' }} />}>
                <Typography>
                  <Send sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Sent Requests ({outgoingFriendRequests.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {outgoingFriendRequests.map(req => (
                    <ListItem key={req.id}>
                      <ListItemAvatar>
                        <PlayerAvatar user={req.user} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={req.user.username}
                        secondary="Pending..."
                      />
                      <ListItemSecondaryAction>
                        <Button size="small" color="error" onClick={() => handleCancelFriendRequest(req.id)}>
                          Cancel
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Add Friend */}
          <Button 
            startIcon={<PersonAdd />} 
            variant="contained" 
            fullWidth 
            onClick={() => setAddFriendDialogOpen(true)}
            sx={{ mb: 2 }}
          >
            Find & Add Friends
          </Button>

          {/* Friends List */}
          <Typography variant="h6" gutterBottom>
            <Group sx={{ verticalAlign: 'middle', mr: 1 }} />
            My Friends ({friends.length})
          </Typography>
          <List>
            {friends.map(friend => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <ListItem 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.03)', 
                    borderRadius: 2, 
                    mb: 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <Circle sx={{ fontSize: 12, color: friend.isOnline ? 'success.main' : 'text.disabled' }} />
                      }
                    >
                      <PlayerAvatar user={friend} />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {friend.username}
                        <Chip label={friend.stats.rank} size="small" sx={{ height: 20, fontSize: 10 }} />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <StatsDisplay stats={friend.stats} compact />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={1}>
                      {friend.hasActiveGame ? (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="primary"
                          startIcon={<PlayArrow />}
                          onClick={() => {
                            const game = activeGames.find(g => g.players.includes(friend.id));
                            if (game) onStartGame(game.id);
                          }}
                        >
                          Play
                        </Button>
                      ) : friend.hasPendingChallenge ? (
                        <Chip label="Challenge Sent" size="small" />
                      ) : (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="secondary"
                          onClick={() => handleChallenge(friend.id)}
                        >
                          Challenge
                        </Button>
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          const user = onlineManager.getUser(friend.id);
                          if (user) handleViewProfile(user);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </motion.div>
            ))}
            {friends.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">No friends yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  Search for players to add them as friends!
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      )}

      {/* Tab 1: Invites/Challenges */}
      {tabValue === 1 && (
        <Box>
          {/* Incoming Challenges */}
          <Typography variant="h6" gutterBottom>
            <Mail sx={{ verticalAlign: 'middle', mr: 1 }} />
            Incoming Challenges
          </Typography>
          {incomingChallenges.length > 0 ? (
            <List>
              {incomingChallenges.map(challenge => (
                <Card key={challenge.id} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      <PlayerAvatar user={challenge.fromUser} size={50} />
                      <Box flex={1}>
                        <Typography variant="h6">{challenge.fromUser.username}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {challenge.message || 'wants to play!'}
                        </Typography>
                        <StatsDisplay stats={challenge.fromUser.stats} compact />
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button 
                      variant="contained" 
                      color="success" 
                      startIcon={<Check />}
                      onClick={() => handleAcceptChallenge(challenge.id)}
                    >
                      Accept & Play
                    </Button>
                    <Button 
                      color="error" 
                      startIcon={<Close />}
                      onClick={() => handleDeclineChallenge(challenge.id)}
                    >
                      Decline
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={4} mb={3}>
              <Typography color="text.secondary">No incoming challenges</Typography>
            </Box>
          )}

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Outgoing Challenges */}
          <Typography variant="h6" gutterBottom>
            <Send sx={{ verticalAlign: 'middle', mr: 1 }} />
            Sent Challenges
          </Typography>
          {outgoingChallenges.length > 0 ? (
            <List>
              {outgoingChallenges.map(challenge => (
                <ListItem 
                  key={challenge.id}
                  sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 1 }}
                >
                  <ListItemAvatar>
                    <PlayerAvatar user={challenge.toUser} />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={challenge.toUser.username}
                    secondary={`${challenge.message || 'Waiting for response...'}`}
                  />
                  <ListItemSecondaryAction>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => handleCancelChallenge(challenge.id)}
                    >
                      Cancel
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">No pending challenges</Typography>
              <Typography variant="body2" color="text.secondary">
                Challenge a friend from the Friends tab!
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Tab 2: Active Games */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            <SportsEsports sx={{ verticalAlign: 'middle', mr: 1 }} />
            Active Games ({activeGames.length})
          </Typography>
          {activeGames.length > 0 ? (
            <List>
              {activeGames.map(game => {
                const opponent = getOpponent(game);
                const isMyTurn = game.currentTurn === currentUser?.id;
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card 
                      sx={{ 
                        mb: 2, 
                        bgcolor: isMyTurn ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255,255,255,0.05)', 
                        color: 'white',
                        border: isMyTurn ? '2px solid #4ECDC4' : 'none'
                      }}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2}>
                          {opponent && <PlayerAvatar user={opponent} size={50} />}
                          <Box flex={1}>
                            <Typography variant="h6">vs {getOpponentName(game)}</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={isMyTurn ? "YOUR TURN" : "Their Turn"} 
                                color={isMyTurn ? "primary" : "default"}
                                size="small"
                              />
                              <Typography variant="caption" color="text.secondary">
                                Move #{game.moveCount + 1}
                              </Typography>
                            </Box>
                          </Box>
                          <Button 
                            variant="contained" 
                            color={isMyTurn ? "primary" : "inherit"}
                            size="large"
                            startIcon={<PlayArrow />}
                            onClick={() => onStartGame(game.id)}
                          >
                            {isMyTurn ? 'Play Now' : 'View Game'}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </List>
          ) : (
            <Box textAlign="center" py={6}>
              <SportsEsports sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No active games</Typography>
              <Typography variant="body2" color="text.secondary">
                Challenge a friend to start playing!
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Tab 3: Leaderboards */}
      {tabValue === 3 && (
        <Box>
          <Box display="flex" gap={2} mb={3}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Leaderboard</InputLabel>
              <Select
                value={leaderboardType}
                label="Leaderboard"
                onChange={(e) => setLeaderboardType(e.target.value as 'global' | 'friends')}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
              >
                <MenuItem value="global">🌍 Global</MenuItem>
                <MenuItem value="friends">👥 Friends</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Sort By</InputLabel>
              <Select
                value={leaderboardSort}
                label="Sort By"
                onChange={(e) => setLeaderboardSort(e.target.value as LeaderboardSortBy)}
                sx={{ color: 'white', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
              >
                <MenuItem value="score">⭐ Score</MenuItem>
                <MenuItem value="wins">🏆 Wins</MenuItem>
                <MenuItem value="gamesPlayed">🎮 Games Played</MenuItem>
                <MenuItem value="winRatio">📈 Win Ratio</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <List>
            {(leaderboardType === 'global' ? leaderboard : friendsLeaderboard).map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ListItem 
                  sx={{ 
                    bgcolor: entry.isCurrentUser 
                      ? 'rgba(78, 205, 196, 0.2)' 
                      : entry.rank <= 3 
                        ? 'rgba(255, 215, 0, 0.1)' 
                        : 'rgba(255,255,255,0.03)',
                    borderRadius: 2,
                    mb: 1,
                    border: entry.isCurrentUser ? '2px solid #4ECDC4' : 'none'
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 40, 
                      textAlign: 'center', 
                      mr: 2,
                      fontSize: entry.rank <= 3 ? 24 : 16,
                      fontWeight: 'bold'
                    }}
                  >
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </Box>
                  <ListItemAvatar>
                    <PlayerAvatar user={{ username: entry.username, avatarColor: entry.avatarColor, stats: entry.stats }} />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {entry.username}
                        {entry.isCurrentUser && <Chip label="YOU" size="small" color="primary" />}
                        {entry.isFriend && !entry.isCurrentUser && <Chip label="Friend" size="small" variant="outlined" />}
                      </Box>
                    }
                    secondary={
                      <Box display="flex" gap={2} mt={0.5}>
                        <Typography variant="caption">Score: {entry.stats.score.toLocaleString()}</Typography>
                        <Typography variant="caption">W: {entry.stats.wins}</Typography>
                        <Typography variant="caption">
                          WR: {entry.stats.gamesPlayed > 0 ? Math.round((entry.stats.wins / entry.stats.gamesPlayed) * 100) : 0}%
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip label={entry.stats.rank} size="small" />
                </ListItem>
              </motion.div>
            ))}
          </List>
        </Box>
      )}

      {/* Tab 4: Game History */}
      {tabValue === 4 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            <History sx={{ verticalAlign: 'middle', mr: 1 }} />
            Recent Games
          </Typography>
          {gameHistory.length > 0 ? (
            <List>
              {gameHistory.slice(0, 20).map((entry) => (
                <ListItem 
                  key={entry.id}
                  sx={{ 
                    bgcolor: entry.result === 'win' 
                      ? 'rgba(46, 204, 113, 0.1)' 
                      : entry.result === 'loss'
                        ? 'rgba(231, 76, 60, 0.1)'
                        : 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    mb: 1,
                    borderLeft: `4px solid ${entry.result === 'win' ? '#2ecc71' : entry.result === 'loss' ? '#e74c3c' : '#f39c12'}`
                  }}
                >
                  <ListItemText 
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={entry.result.toUpperCase()} 
                          size="small"
                          color={entry.result === 'win' ? 'success' : entry.result === 'loss' ? 'error' : 'warning'}
                        />
                        vs {entry.opponentName}
                      </Box>
                    }
                    secondary={
                      <Box display="flex" gap={2} mt={0.5}>
                        <Typography variant="caption">{entry.moveCount} moves</Typography>
                        <Typography variant="caption" color={entry.scoreChange >= 0 ? 'success.main' : 'error.main'}>
                          {entry.scoreChange >= 0 ? '+' : ''}{entry.scoreChange} pts
                        </Typography>
                        <Typography variant="caption">
                          {new Date(entry.playedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={6}>
              <History sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">No games played yet</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Add Friend Dialog */}
      <Dialog 
        open={addFriendDialogOpen} 
        onClose={() => setAddFriendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1a2e', color: 'white' } }}
      >
        <DialogTitle>Find & Add Friends</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search by username"
            placeholder="e.g. ConnectMaster#2847"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </InputAdornment>
              ),
              sx: { color: 'white' }
            }}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
            }}
          />
          
          {searchResults.length > 0 && (
            <List>
              {searchResults.map(user => {
                const isFriend = currentUser?.friends.includes(user.id);
                const hasPendingRequest = outgoingFriendRequests.some(r => r.user.id === user.id);
                return (
                  <ListItem 
                    key={user.id}
                    sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, mb: 1 }}
                  >
                    <ListItemAvatar>
                      <PlayerAvatar user={user} />
                    </ListItemAvatar>
                    <ListItemText 
                      primary={user.username}
                      secondary={
                        <Box>
                          <Typography variant="caption">{user.stats.rank} • {user.stats.score} pts</Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {isFriend ? (
                        <Chip label="Already Friends" size="small" />
                      ) : hasPendingRequest ? (
                        <Chip label="Request Sent" size="small" />
                      ) : (
                        <Button 
                          size="small" 
                          variant="contained"
                          startIcon={<PersonAdd />}
                          onClick={() => handleSendFriendRequest(user.id)}
                        >
                          Add
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No users found matching "{searchQuery}"
            </Typography>
          )}

          {searchQuery.length < 2 && (
            <Typography color="text.secondary" textAlign="center" py={3}>
              Type at least 2 characters to search
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFriendDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Challenge Dialog */}
      <Dialog 
        open={challengeDialogOpen} 
        onClose={() => setChallengeDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: '#1a1a2e', color: 'white' } }}
      >
        <DialogTitle>Send Challenge</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Challenge {friends.find(f => f.id === selectedFriendForChallenge)?.username} to a game!
          </Typography>
          <TextField
            margin="dense"
            label="Add a message (optional)"
            fullWidth
            multiline
            rows={2}
            value={challengeMessage}
            onChange={(e) => setChallengeMessage(e.target.value)}
            placeholder="Let's play! 🎮"
            sx={{ 
              mt: 2,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChallengeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendChallenge} variant="contained" color="secondary">
            Send Challenge
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile View Dialog */}
      <Dialog 
        open={profileDialogOpen} 
        onClose={() => { setProfileDialogOpen(false); setEditingProfile(false); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1a2e', color: 'white' } }}
      >
        <DialogTitle>
          {viewProfileUser?.id === currentUser?.id ? 'Your Profile' : 'Player Profile'}
        </DialogTitle>
        <DialogContent>
          {viewProfileUser && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                {editingProfile ? (
                  <Box>
                    <Typography variant="caption" gutterBottom display="block">Choose Avatar Color</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {avatarColors.map(color => (
                        <Box
                          key={color}
                          onClick={() => setEditAvatarColor(color)}
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: color,
                            cursor: 'pointer',
                            border: editAvatarColor === color ? '3px solid white' : '3px solid transparent'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <PlayerAvatar user={viewProfileUser} size={80} />
                )}
                <Box flex={1}>
                  <Typography variant="h5">{viewProfileUser.username}</Typography>
                  {editingProfile ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Write a bio..."
                      sx={{ 
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
                        }
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">{viewProfileUser.bio}</Typography>
                  )}
                  <Chip label={viewProfileUser.stats.rank} size="small" sx={{ mt: 1 }} icon={<Stars />} />
                </Box>
              </Box>
              
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
              
              <StatsDisplay stats={viewProfileUser.stats} />

              {viewProfileUser.id !== currentUser?.id && (
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>Head to Head</Typography>
                  {(() => {
                    const h2h = onlineManager.getHeadToHead(viewProfileUser.id);
                    return (
                      <Box display="flex" gap={2}>
                        <Chip label={`You: ${h2h.wins}W`} color="success" variant="outlined" />
                        <Chip label={`Them: ${h2h.losses}W`} color="error" variant="outlined" />
                        <Chip label={`Draws: ${h2h.draws}`} variant="outlined" />
                      </Box>
                    );
                  })()}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {viewProfileUser?.id === currentUser?.id && (
            editingProfile ? (
              <Button onClick={handleSaveProfile} variant="contained" startIcon={<Save />}>
                Save Changes
              </Button>
            ) : (
              <Button onClick={handleEditProfile} startIcon={<Edit />}>
                Edit Profile
              </Button>
            )
          )}
          <Button onClick={() => { setProfileDialogOpen(false); setEditingProfile(false); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
