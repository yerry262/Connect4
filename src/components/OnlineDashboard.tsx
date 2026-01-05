import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, List, ListItem, ListItemText, 
  ListItemSecondaryAction, IconButton, Button, TextField, 
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
  Badge, Divider, Tabs, Tab, Card, CardContent, CardActions
} from '@mui/material';
import { 
  PersonAdd, PlayArrow, Check, Close, SportsEsports, 
  Refresh, Circle, Notifications
} from '@mui/icons-material';
import { onlineManager } from '../utils/onlineManager';
import { OnlineUser, FriendDisplay, OnlineGame, OnlineChallenge } from '../types/online';

interface OnlineDashboardProps {
  onStartGame: (gameId: string) => void;
  onClose: () => void;
}

export const OnlineDashboard: React.FC<OnlineDashboardProps> = ({ onStartGame, onClose }) => {
  const [currentUser, setCurrentUser] = useState<OnlineUser | null>(null);
  const [friends, setFriends] = useState<FriendDisplay[]>([]);
  const [activeGames, setActiveGames] = useState<OnlineGame[]>([]);
  const [pendingChallenges, setPendingChallenges] = useState<OnlineChallenge[]>([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);

  const updateState = () => {
    setCurrentUser(onlineManager.getCurrentUser());
    setFriends(onlineManager.getFriends());
    setActiveGames(onlineManager.getActiveGames());
    setPendingChallenges(onlineManager.getPendingChallenges());
  };

  useEffect(() => {
    updateState();
    const unsubscribe = onlineManager.subscribe(() => {
      updateState();
    });
    return unsubscribe;
  }, []);

  const handleAddFriend = () => {
    if (newFriendName) {
      const success = onlineManager.addFriend(newFriendName);
      if (success) {
        setNewFriendName('');
        setAddFriendDialogOpen(false);
      } else {
        alert('User not found or already added');
      }
    }
  };

  const handleChallenge = (friendId: string) => {
    onlineManager.sendChallenge(friendId);
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

  const getOpponentName = (game: OnlineGame) => {
    const opponentId = game.players.find(p => p !== currentUser?.id);
    if (!opponentId) return 'Unknown';
    const user = onlineManager.getUser(opponentId);
    return user ? user.username : opponentId;
  };

  const getChallengerName = (challenge: OnlineChallenge) => {
    const user = onlineManager.getUser(challenge.fromUserId);
    return user ? user.username : challenge.fromUserId;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4, maxHeight: '80vh', overflow: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Online Dashboard</Typography>
        <IconButton onClick={onClose}><Close /></IconButton>
      </Box>

      {currentUser && (
        <Box mb={3} p={2} bgcolor="action.hover" borderRadius={1}>
          <Typography variant="subtitle1">Logged in as:</Typography>
          <Typography variant="h4" color="primary">{currentUser.username}</Typography>
          <Typography variant="caption" color="textSecondary">ID: {currentUser.id}</Typography>
        </Box>
      )}

      {pendingChallenges.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" color="secondary" gutterBottom>
            <Notifications sx={{ verticalAlign: 'middle', mr: 1 }} />
            Game Invites
          </Typography>
          {pendingChallenges.map(challenge => (
            <Card key={challenge.id} variant="outlined" sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="subtitle1">
                  Challenge from <strong>{getChallengerName(challenge)}</strong>
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {new Date(challenge.createdAt).toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary" variant="contained" onClick={() => handleAcceptChallenge(challenge.id)}>Accept</Button>
                <Button size="small" color="error" onClick={() => handleDeclineChallenge(challenge.id)}>Decline</Button>
              </CardActions>
            </Card>
          ))}
          <Divider sx={{ my: 2 }} />
        </Box>
      )}

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Friends" />
        <Tab label="Active Games" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Button 
            startIcon={<PersonAdd />} 
            variant="contained" 
            fullWidth 
            onClick={() => setAddFriendDialogOpen(true)}
            sx={{ mb: 2 }}
          >
            Add Friend
          </Button>

          <List>
            {friends.map(friend => (
              <ListItem key={friend.id} divider>
                <ListItemText 
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      {friend.username}
                      <Circle sx={{ fontSize: 12, color: friend.isOnline ? 'success.main' : 'text.disabled' }} />
                    </Box>
                  }
                  secondary={friend.hasActiveGame ? 'Game in progress' : friend.hasPendingChallenge ? 'Challenge Pending' : 'Ready to play'}
                />
                <ListItemSecondaryAction>
                  {friend.hasActiveGame ? (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<PlayArrow />}
                      onClick={() => {
                        const game = activeGames.find(g => g.players.includes(friend.id));
                        if (game) onStartGame(game.id);
                      }}
                    >
                      Resume
                    </Button>
                  ) : friend.hasPendingChallenge ? (
                    <Chip label="Sent" size="small" />
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
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {friends.length === 0 && (
              <Typography align="center" color="textSecondary" py={4}>
                No friends yet. Add someone to start playing!
              </Typography>
            )}
          </List>
        </Box>
      )}

      {tabValue === 1 && (
        <List>
          {activeGames.map(game => (
            <ListItem key={game.id} divider>
              <ListItemText 
                primary={`Vs ${getOpponentName(game)}`}
                secondary={`Turn: ${game.currentTurn === currentUser?.id ? 'Your Turn' : 'Their Turn'}`}
              />
              <ListItemSecondaryAction>
                <Button 
                  variant="contained" 
                  color={game.currentTurn === currentUser?.id ? 'primary' : 'inherit'}
                  onClick={() => onStartGame(game.id)}
                >
                  Play
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {activeGames.length === 0 && (
            <Typography align="center" color="textSecondary" py={4}>
              No active games.
            </Typography>
          )}
        </List>
      )}

      <Dialog open={addFriendDialogOpen} onClose={() => setAddFriendDialogOpen(false)}>
        <DialogTitle>Add Friend</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username (e.g. Player#1234)"
            fullWidth
            value={newFriendName}
            onChange={(e) => setNewFriendName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFriendDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFriend} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

