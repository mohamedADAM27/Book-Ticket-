import React from 'react';

interface QRCodeSVGProps {
  value: string;
  size?: number;
}

export default function QRCodeSVG({ value, size = 160 }: QRCodeSVGProps) {
  // Simple deterministic hash function to generate consistent cells for a given text
  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const gridSize = 25;
  const hash = getHash(value);

  // Initialize a grid
  const grid: boolean[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(false));

  // Pre-fill the 3 locator squares in corners (7x7)
  const isLocatorSquare = (row: number, col: number) => {
    // Top-Left
    if (row < 7 && col < 7) {
      return (row === 0 || row === 6 || col === 0 || col === 6) || (row >= 2 && row <= 4 && col >= 2 && col <= 4);
    }
    // Top-Right
    if (row < 7 && col >= gridSize - 7) {
      const c = col - (gridSize - 7);
      return (row === 0 || row === 6 || c === 0 || c === 6) || (row >= 2 && row <= 4 && c >= 2 && c <= 4);
    }
    // Bottom-Left
    if (row >= gridSize - 7 && col < 7) {
      const r = row - (gridSize - 7);
      return (r === 0 || r === 6 || col === 0 || col === 6) || (r >= 2 && r <= 4 && col >= 2 && col <= 4);
    }
    return false;
  };

  // Safe separator spacing around corners
  const isLocatorSeparator = (row: number, col: number) => {
    // Top-Left
    if ((row === 7 && col < 8) || (col === 7 && row < 8)) return true;
    // Top-Right
    if ((row === 7 && col >= gridSize - 8) || (col === gridSize - 8 && row < 8)) return true;
    // Bottom-Left
    if ((row === gridSize - 8 && col < 8) || (col === 7 && row >= gridSize - 8)) return true;
    return false;
  };

  // Alignment Pattern (5x5 sub-lock, centered at (18, 18))
  const isAlignmentPattern = (row: number, col: number) => {
    const rDiff = Math.abs(row - 18);
    const cDiff = Math.abs(col - 18);
    if (rDiff <= 2 && cDiff <= 2) {
      return rDiff === 2 || cDiff === 2 || (rDiff === 0 && cDiff === 0);
    }
    return false;
  };

  // Alternating timing registers (Row 6 / Column 6)
  const isTimingRegister = (row: number, col: number) => {
    if (row === 6 && col >= 7 && col < gridSize - 7) {
      return col % 2 === 0;
    }
    if (col === 6 && row >= 7 && row < gridSize - 7) {
      return row % 2 === 0;
    }
    return null;
  };

  // Populate cell matrix deterministically
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (
        (r < 7 && c < 7) ||
        (r < 7 && c >= gridSize - 7) ||
        (r >= gridSize - 7 && c < 7)
      ) {
        grid[r][c] = isLocatorSquare(r, c);
      } else if (isLocatorSeparator(r, c)) {
        grid[r][c] = false;
      } else if (r >= 16 && r <= 20 && c >= 16 && c <= 20) {
        grid[r][c] = isAlignmentPattern(r, c);
      } else {
        const timingValue = isTimingRegister(r, c);
        if (timingValue !== null) {
          grid[r][c] = timingValue;
        } else {
          // Mixed hash function for crisp, dense distribution
          const indexVal = r * gridSize + c;
          const mixHash = getHash(value + "_" + indexVal);
          grid[r][c] = (mixHash % 2) === 0;
        }
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 border border-dashed border-[#991b1b] rounded-lg">
      <div className="relative p-2 border border-slate-100 bg-white">
        {/* Optical corner targets */}
        <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#991b1b]"></div>
        <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#991b1b]"></div>
        <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#991b1b]"></div>
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#991b1b]"></div>
        
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded">
          <rect width={size} height={size} fill="#ffffff" />
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              if (!cell) return null;
              
              // Color locator/alignment squares in crimson `#991b1b` and data nodes in dark slate
              const isCorner = 
                (rIdx < 7 && cIdx < 7) ||
                (rIdx < 7 && cIdx >= gridSize - 7) ||
                (rIdx >= gridSize - 7 && cIdx < 7);
                
              const isAlignment = (rIdx >= 16 && rIdx <= 20 && cIdx >= 16 && cIdx <= 20);
                
              const fillColor = (isCorner || isAlignment) ? "#991b1b" : "#0f172a";
              
              return (
                <rect
                  key={`${rIdx}-${cIdx}`}
                  x={cIdx * cellSize}
                  y={rIdx * cellSize}
                  width={cellSize + 0.15} // micro gap overlap for high screen physical density support
                  height={cellSize + 0.15}
                  fill={fillColor}
                  shapeRendering="crispEdges"
                />
              );
            })
          )}
        </svg>
      </div>
      <div className="mt-3 flex flex-col items-center text-center">
        <span className="text-[10px] font-mono tracking-widest text-[#991b1b] font-bold uppercase">
          SECURE TRANSIT CORE
        </span>
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mt-0.5 select-all">
          {value}
        </span>
      </div>
    </div>
  );
}
