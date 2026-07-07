import { memo } from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';
import { isLowPowerDevice, prefersReducedMotion } from '../utils/performance';

interface GamePieceProps {
  color: string;
  row: number;
  isWinningPiece?: boolean;
  isNew?: boolean;
  /** Cell size / gap in px, computed once by the board (not per piece). */
  cellHeight: number;
  gapSize: number;
}

export const GamePiece = memo(function GamePiece({
  color,
  row,
  isWinningPiece = false,
  isNew = false,
  cellHeight,
  gapSize,
}: GamePieceProps) {
  // On constrained devices, drop the infinite winning-piece pulse so the
  // board doesn't animate forever after a win.
  const reduceMotion = isLowPowerDevice() || prefersReducedMotion();
  const pulse = isWinningPiece && !reduceMotion;

  // Calculate drop distance from top of board (all rows above + gaps + extra for above board)
  const dropDistance = (row * (cellHeight + gapSize)) + (cellHeight * 2) + 100;

  return (
    <motion.div
      initial={isNew ? { y: -dropDistance, scale: 0.8 } : { y: 0, scale: 1 }}
      animate={{
        y: 0,
        scale: pulse ? [1, 1.1, 1] : 1,
      }}
      transition={
        isNew
          ? {
              type: 'spring',
              stiffness: 300,
              damping: 20,
              mass: 1,
            }
          : pulse
          ? {
              scale: {
                duration: 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
          : {}
      }
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '85%',
          height: '85%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${lightenColor(color, 40)}, ${color}, ${darkenColor(color, 30)})`,
          boxShadow: isWinningPiece
            ? `0 0 20px ${color}, 0 0 40px ${color}, inset 0 -5px 15px rgba(0,0,0,0.3), inset 0 5px 10px rgba(255,255,255,0.3)`
            : `inset 0 -5px 15px rgba(0,0,0,0.3), inset 0 5px 10px rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.3)`,
          border: `3px solid ${darkenColor(color, 20)}`,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '15%',
            left: '20%',
            width: '25%',
            height: '20%',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.4)',
            filter: 'blur(2px)',
          },
        }}
      />
    </motion.div>
  );
});

// Utility functions to lighten/darken colors. Results are memoized — the
// same handful of player colours are recomputed for every piece otherwise.
const colorCache = new Map<string, string>();

function lightenColor(color: string, percent: number): string {
  const key = `l${percent}:${color}`;
  const cached = colorCache.get(key);
  if (cached) return cached;
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  const result = `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  colorCache.set(key, result);
  return result;
}

function darkenColor(color: string, percent: number): string {
  const key = `d${percent}:${color}`;
  const cached = colorCache.get(key);
  if (cached) return cached;
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  const result = `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  colorCache.set(key, result);
  return result;
}
