# Connect 4 🎮

A modern, interactive Connect 4 game built with React, TypeScript, Material-UI, and Framer Motion. Features beautiful animations, an interactive particle background, and a polished UI suitable for kids and adults alike.

![Connect 4](https://img.shields.io/badge/React-19.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Vite](https://img.shields.io/badge/Vite-7.2-purple) ![Tests](https://img.shields.io/badge/Tests-61%20passing-green)

## 🎯 Features

### ✅ Completed

- **Main Menu**
  - Game title with gradient animation
  - Game mode selection (1v1, vs Computer, Online PvP)
  - Player name customization
  - Color picker with 5 vibrant color options per player
  - Beautiful glassmorphism UI design

- **Game Board**
  - 7x6 interactive grid with hover effects
  - Animated piece drops with spring physics (gravity simulation)
  - Column preview showing where piece will land
  - Current player indicator with animated transitions
  - Winning pieces pulse/glow animation
  - Board stand visual element

- **Game Logic**
  - Turn-based gameplay alternating between players
  - Win detection (horizontal, vertical, diagonal)
  - Draw detection when board is full
  - Gravity physics - pieces fall to lowest available row
  - Move history tracking

- **1 vs Computer Mode**
  - AI opponent with 3 difficulty levels
  - Easy: Random valid moves
  - Medium: Strategic blocking and basic tactics
  - Hard: Minimax algorithm with alpha-beta pruning

- **Game Controls**
  - Pause/Resume functionality with overlay
  - Undo last move
  - Reset game with confirmation dialog
  - Exit to menu with confirmation dialog
  - Timer per turn (optional, 5-60 seconds)

- **Game Over**
  - Winner announcement with confetti celebration
  - Draw announcement
  - Play Again option
  - Return to Menu option

- **Visual Effects**
  - Interactive particle background (responds to mouse/touch)
  - Confetti animation on win
  - Smooth Framer Motion animations throughout
  - Glassmorphism UI components
  - Responsive design

- **Performance & In-Car (Tesla) Optimizations** 🚗
  - Auto-detects Tesla / low-power browsers and `prefers-reduced-motion`,
    then scales animations down (`src/utils/performance.ts`)
  - Particle background: capped particle count, cached glow sprites (no
    per-frame gradient allocation), spatial-grid connection lines (~O(n)
    instead of O(n²)), capped device-pixel-ratio, and 30 FPS throttling on
    constrained devices
  - Canvas loops pause when the tab/app is backgrounded; confetti auto-stops
    instead of looping forever
  - Reduced-motion users get static (non-looping) win celebrations
  - Force the low-power path on any device for testing with `?tesla` or
    `?lowpower=1` in the URL

- **Online PvP Mode** 🆕
  - Full online multiplayer dashboard
  - Player profiles with customizable avatars and bios
  - Friend system with friend requests (send/accept/decline)
  - Game challenges with optional messages
  - Turn-based asynchronous gameplay
  - Your turn notifications and badges

- **Social Features** 🆕
  - User search to find and add friends
  - Friend list with online status indicators
  - Head-to-head statistics against each opponent
  - Challenge friends with custom messages
  - View any player's profile and stats

- **Player Statistics & Scoring** 🆕
  - Comprehensive stats tracking (wins, losses, draws, games played)
  - Score system: +100 for wins, +25 for draws, -10 for losses
  - Win streak tracking (current and best)
  - Rank system: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
  - Game history with score changes

- **Leaderboards** 🆕
  - Global leaderboards with all players
  - Friends-only leaderboard
  - Sort by: Score, Wins, Games Played, Win Ratio
  - Visual rank badges and indicators
  - Highlight your position and friends

- **Data Persistence** 🆕
  - All game data saved to localStorage
  - Profile settings persist across sessions
  - Friend lists and game history preserved
  - Automatic data migration for updates

- **Testing**
  - 61 unit and integration tests passing
  - Game logic tests (win detection, gravity, board state)
  - Component tests (MainMenu, GameBoard, GameControls, GameOverModal)
  - Hook integration tests

### 🚧 TODO / Coming Soon

- **Real-time Multiplayer**
  - WebSocket/Firebase integration for live games
  - Real-time opponent moves without refresh
  - Online presence indicators (actual real-time status)

- **Push Notifications**
  - Browser notifications for game invites
  - Notify when it's your turn
  - Friend request notifications

- **Sound Effects**
  - Piece drop sound
  - Win celebration sound
  - Button click sounds
  - Background music (optional)

- **Additional Features to Consider**
  - Tournament/bracket mode
  - Custom board sizes (8x8, 5x5, etc.)
  - Accessibility improvements (keyboard navigation, screen reader support)
  - Mobile-optimized touch controls
  - Theme customization (dark/light/custom)
  - Chat system for online games
  - Spectator mode for watching live games
  - Replay system for past games
  - Achievements and badges
  - Seasonal rankings and rewards

## 🛠️ Tech Stack

- **Frontend**: React 19.2, TypeScript 5.9
- **Build Tool**: Vite 7.2
- **UI Library**: Material-UI (MUI) 7.3
- **Animations**: Framer Motion 12.23
- **Testing**: Vitest, React Testing Library
- **Styling**: Emotion (CSS-in-JS)

## 📁 Project Structure

```
src/
├── components/
│   ├── AnimatedBackground.tsx  # Interactive particle canvas background
│   ├── Confetti.tsx            # Win celebration confetti effect
│   ├── GameBoard.tsx           # Main 7x6 game grid
│   ├── GameControls.tsx        # Pause, undo, reset, exit buttons
│   ├── GameOverModal.tsx       # Winner/draw announcement modal
│   ├── GamePiece.tsx           # Animated circular game pieces
│   ├── MainMenu.tsx            # Start screen with settings
│   ├── OnlineDashboard.tsx     # Online PvP hub with friends, leaderboards
│   ├── OnlineGame.tsx          # Online game view with player cards
│   ├── WinCelebration.tsx      # Victory celebration animation
│   └── index.ts                # Component exports
├── hooks/
│   ├── useConnect4.ts          # Game state management hook
│   └── index.ts                # Hook exports
├── types/
│   ├── game.ts                 # Game TypeScript interfaces
│   ├── online.ts               # Online/social TypeScript interfaces
│   └── index.ts                # Type exports
├── utils/
│   ├── ai.ts                   # AI opponent logic (minimax)
│   ├── onlineManager.ts        # Online data manager (friends, games, stats)
│   ├── soundManager.ts         # Sound effects handler
│   ├── storageManager.ts       # Local storage utilities
│   └── usernameGenerator.ts    # Random username generator
├── test/
│   ├── setup.ts                # Test configuration
│   ├── gameLogic.test.ts       # Game logic unit tests
│   ├── integration.test.tsx    # Hook integration tests
│   ├── MainMenu.test.tsx       # MainMenu component tests
│   ├── GameBoard.test.tsx      # GameBoard component tests
│   ├── GameControls.test.tsx   # GameControls component tests
│   ├── GameOverModal.test.tsx  # GameOverModal component tests
│   └── storageManager.test.ts  # Storage manager tests
├── App.tsx                     # Main app component
├── App.css                     # App styles (minimal)
├── index.css                   # Global styles
└── main.tsx                    # Entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Connect4

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |

## 🎮 How to Play

1. **Start**: Enter player names and choose colors on the main menu
2. **Play**: Click on any column to drop your piece
3. **Win**: Connect 4 pieces horizontally, vertically, or diagonally
4. **Controls**: Use the control buttons to pause, undo, reset, or exit

## 🔧 Known Issues / Technical Debt

1. **AnimatedBackground.tsx** - Has a React hooks dependency warning about `animate` being accessed before declaration. Works correctly but could be refactored.

2. **GameBoard.tsx** - Has a warning about setState in useEffect for board reset animation. Consider refactoring to use a different approach.

3. **Canvas in Tests** - Tests show "HTMLCanvasElement's getContext() method not implemented" warnings. This is expected in jsdom and doesn't affect test results.

## 🤝 Contributing

### Adding the AI Opponent

The AI implementation should:
1. Create a new hook `useAI.ts` or extend `useConnect4.ts`
2. Implement minimax algorithm with alpha-beta pruning
3. Add difficulty levels (Easy, Medium, Hard)
4. Easy: Random valid moves
5. Medium: Block obvious wins, simple heuristics
6. Hard: Full minimax with depth 6-8

### Code Style

- Use TypeScript strict mode
- Follow React hooks best practices
- Use type-only imports for TypeScript types
- Write tests for new features
- Use Framer Motion for animations
- Follow MUI theming conventions

## 📄 License

MIT

## 👥 Authors

- Initial Development: GitHub Copilot + Human collaboration

---

**Happy Gaming! 🎉**
