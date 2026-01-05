import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { COLS, ROWS } from '../types';
import type { Board, Player, WinningLine } from '../types';
import { GamePiece } from './GamePiece';
import { useState, useEffect } from 'react';

interface GameBoardProps {
  board: Board;
  players: [Player, Player];
  currentPlayer: 1 | 2;
  winner: WinningLine | null;
  onColumnClick: (col: number) => void;
  canDropInColumn: (col: number) => boolean;
  lastMove: { row: number; col: number } | null;
}

export function GameBoard({
  board,
  players,
  currentPlayer,
  winner,
  onColumnClick,
  canDropInColumn,
  lastMove,
}: GameBoardProps) {
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [boardKey, setBoardKey] = useState(0);

  // Track when the board resets
  useEffect(() => {
    const isEmpty = board.every((row) => row.every((cell) => cell === null));
    if (isEmpty) {
      setBoardKey((prev) => prev + 1);
    }
  }, [board]);

  const isWinningCell = (row: number, col: number): boolean => {
    if (!winner) return false;
    return winner.cells.some((cell) => cell.row === row && cell.col === col);
  };

  const isLastMove = (row: number, col: number): boolean => {
    return lastMove?.row === row && lastMove?.col === col;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {/* Current Player Indicator */}
      <motion.div
        key={`player-indicator-${currentPlayer}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 4,
            py: 2,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${players[currentPlayer - 1].color}, ${players[currentPlayer - 1].color}99)`,
              boxShadow: `0 0 15px ${players[currentPlayer - 1].color}`,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {players[currentPlayer - 1].name}'s Turn
          </Typography>
        </Box>
      </motion.div>

      {/* Column Hover Preview */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 70px)`,
          gap: '8px',
          height: '70px',
          mb: -1,
        }}
      >
        {Array(COLS)
          .fill(null)
          .map((_, col) => (
            <Box
              key={col}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
              }}
            >
              <AnimatePresence>
                {hoveredColumn === col && canDropInColumn(col) && !winner && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: players[currentPlayer - 1].color,
                        opacity: 0.7,
                        boxShadow: `0 0 20px ${players[currentPlayer - 1].color}`,
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          ))}
      </Box>

      {/* Game Board */}
      <motion.div
        key={boardKey}
        initial={{ scale: 0.9, rotateX: 10 }}
        animate={{ scale: 1, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 70px)`,
            gridTemplateRows: `repeat(${ROWS}, 70px)`,
            gap: '8px',
            p: 3,
            background: 'linear-gradient(145deg, #1E3A8A, #1E40AF, #2563EB)',
            borderRadius: 4,
            boxShadow: `
              0 20px 60px rgba(0,0,0,0.4),
              inset 0 2px 0 rgba(255,255,255,0.1),
              inset 0 -2px 0 rgba(0,0,0,0.2)
            `,
            border: '4px solid #3B82F6',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
              borderRadius: 3,
              pointerEvents: 'none',
            },
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                whileHover={canDropInColumn(colIndex) && !winner ? { scale: 1.05 } : {}}
                onClick={() => onColumnClick(colIndex)}
                onMouseEnter={() => setHoveredColumn(colIndex)}
                onMouseLeave={() => setHoveredColumn(null)}
                style={{
                  width: '70px',
                  height: '70px',
                  cursor: canDropInColumn(colIndex) && !winner ? 'pointer' : 'default',
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(180deg, #0F172A, #1E293B)',
                    boxShadow: `
                      inset 0 4px 8px rgba(0,0,0,0.5),
                      inset 0 -2px 4px rgba(255,255,255,0.1),
                      0 2px 4px rgba(0,0,0,0.2)
                    `,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <AnimatePresence>
                    {cell !== null && (
                      <GamePiece
                        color={players[cell - 1].color}
                        row={rowIndex}
                        isWinningPiece={isWinningCell(rowIndex, colIndex)}
                        isNew={isLastMove(rowIndex, colIndex)}
                      />
                    )}
                  </AnimatePresence>
                </Box>
              </motion.div>
            ))
          )}
        </Box>
      </motion.div>

      {/* Board Stand */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 600,
          height: 30,
          background: 'linear-gradient(180deg, #1E40AF, #1E3A8A)',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          mt: -1,
        }}
      />
    </Box>
  );
}
