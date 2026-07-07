import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { COLS, ROWS } from '../types';
import type { Board, CellValue, Player, WinningLine } from '../types';
import { GamePiece } from './GamePiece';

interface GameBoardProps {
  board: Board;
  players: [Player, Player];
  currentPlayer: 1 | 2;
  winner: WinningLine | null;
  onColumnClick: (col: number) => void;
  canDropInColumn: (col: number) => boolean;
  lastMove: { row: number; col: number } | null;
}

// Static styles hoisted out of the render path so the 42 cells don't rebuild
// them on every board/hover update.
const cellSlotSx = {
  width: { xs: 'min(12vw, 42px)', sm: '60px', md: '70px' },
  height: { xs: 'min(12vw, 42px)', sm: '60px', md: '70px' },
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
} as const;

const hoverScale = { scale: 1.05 };

interface BoardCellProps {
  cell: CellValue;
  row: number;
  col: number;
  color: string | null;
  isWinning: boolean;
  isNew: boolean;
  clickable: boolean;
  cellHeight: number;
  gapSize: number;
  onColumnClick: (col: number) => void;
  onHoverColumn: (col: number | null) => void;
}

/**
 * One board slot. Memoized so hover/turn changes only re-render the cells
 * whose props actually changed instead of all 42 (each with its own MUI sx
 * resolution and framer-motion wrapper).
 */
const BoardCell = memo(function BoardCell({
  cell,
  row,
  col,
  color,
  isWinning,
  isNew,
  clickable,
  cellHeight,
  gapSize,
  onColumnClick,
  onHoverColumn,
}: BoardCellProps) {
  const handleClick = useCallback(() => onColumnClick(col), [onColumnClick, col]);
  const handleMouseEnter = useCallback(() => onHoverColumn(col), [onHoverColumn, col]);
  const handleMouseLeave = useCallback(() => onHoverColumn(null), [onHoverColumn]);

  return (
    <motion.div
      whileHover={clickable ? hoverScale : undefined}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <Box sx={cellSlotSx}>
        <AnimatePresence>
          {cell !== null && color !== null && (
            <GamePiece
              color={color}
              row={row}
              isWinningPiece={isWinning}
              isNew={isNew}
              cellHeight={cellHeight}
              gapSize={gapSize}
            />
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
});

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

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Cell metrics for the piece drop animation, computed once here instead of
  // running two media queries inside every piece.
  const cellHeight = isXs ? 42 : isSm ? 60 : 70;
  const gapSize = isXs ? 4 : isSm ? 6 : 8;

  // Track when the board resets
  useEffect(() => {
    const isEmpty = board.every((row) => row.every((cell) => cell === null));
    if (isEmpty) {
      setBoardKey((prev) => prev + 1);
    }
  }, [board]);

  // O(1) winning-cell lookups instead of scanning the winner line per cell.
  const winningCells = useMemo(() => {
    const cells = new Set<number>();
    if (winner) {
      for (const cell of winner.cells) {
        cells.add(cell.row * COLS + cell.col);
      }
    }
    return cells;
  }, [winner]);

  // Evaluate droppability once per column per render, not once per cell.
  // (canDropInColumn's identity changes whenever board/winner state does.)
  const droppableCols = useMemo(
    () => Array.from({ length: COLS }, (_, col) => canDropInColumn(col)),
    [canDropInColumn]
  );

  const currentColor = players[currentPlayer - 1].color;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 1, md: 2 },
        width: '100%',
        maxWidth: '100vw',
        px: { xs: 1, sm: 2, md: 0 },
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
            gap: { xs: 1, md: 2 },
            px: { xs: 2, md: 4 },
            py: { xs: 1.5, md: 2 },
            borderRadius: 4,
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Box
            sx={{
              width: { xs: 30, md: 40 },
              height: { xs: 30, md: 40 },
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${currentColor}, ${currentColor}99)`,
              boxShadow: `0 0 15px ${currentColor}`,
            }}
          />
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
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
          gridTemplateColumns: {
            xs: `repeat(${COLS}, min(12vw, 42px))`,
            sm: `repeat(${COLS}, 60px)`,
            md: `repeat(${COLS}, 70px)`,
          },
          gap: { xs: '4px', sm: '6px', md: '8px' },
          height: { xs: 'min(12vw, 42px)', sm: '60px', md: '70px' },
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
                {hoveredColumn === col && droppableCols[col] && !winner && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Box
                      sx={{
                        width: { xs: 'min(10vw, 35px)', sm: 45, md: 50 },
                        height: { xs: 'min(10vw, 35px)', sm: 45, md: 50 },
                        borderRadius: '50%',
                        background: currentColor,
                        opacity: 0.7,
                        boxShadow: `0 0 20px ${currentColor}`,
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
            gridTemplateColumns: {
              xs: `repeat(${COLS}, min(12vw, 42px))`,
              sm: `repeat(${COLS}, 60px)`,
              md: `repeat(${COLS}, 70px)`,
            },
            gridTemplateRows: {
              xs: `repeat(${ROWS}, min(12vw, 42px))`,
              sm: `repeat(${ROWS}, 60px)`,
              md: `repeat(${ROWS}, 70px)`,
            },
            gap: { xs: '4px', sm: '6px', md: '8px' },
            p: { xs: 1.5, sm: 2, md: 3 },
            background: 'linear-gradient(145deg, #1E3A8A, #1E40AF, #2563EB)',
            borderRadius: 4,
            boxShadow: `
              0 20px 60px rgba(0,0,0,0.4),
              inset 0 2px 0 rgba(255,255,255,0.1),
              inset 0 -2px 0 rgba(0,0,0,0.2)
            `,
            border: { xs: '3px solid #3B82F6', md: '4px solid #3B82F6' },
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
              <BoardCell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                row={rowIndex}
                col={colIndex}
                color={cell !== null ? players[cell - 1].color : null}
                isWinning={winningCells.has(rowIndex * COLS + colIndex)}
                isNew={lastMove?.row === rowIndex && lastMove?.col === colIndex}
                clickable={droppableCols[colIndex] && !winner}
                cellHeight={cellHeight}
                gapSize={gapSize}
                onColumnClick={onColumnClick}
                onHoverColumn={setHoveredColumn}
              />
            ))
          )}
        </Box>
      </motion.div>

      {/* Board Stand */}
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 350, sm: 450, md: 600 },
          height: { xs: 20, md: 30 },
          background: 'linear-gradient(180deg, #1E40AF, #1E3A8A)',
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          mt: -1,
        }}
      />
    </Box>
  );
}
