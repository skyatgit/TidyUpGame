
import React, { forwardRef } from 'react';
import { GameContainer, GameItem, ItemType } from '../types';

interface ContainerBoxProps {
  container: GameContainer;
  // If this container is the current drop target, this contains the cell coordinates
  hoverTarget: { r: number, c: number, isValid: boolean } | null;
  draggedItem: GameItem | null;
  onPack: (containerId: string) => void;
  translations: any;
}

const CELL_SIZE = 34; // Matches App.tsx logic

export const ContainerBox = forwardRef<HTMLDivElement, ContainerBoxProps>(({ 
  container, 
  hoverTarget,
  draggedItem, 
  onPack,
  translations 
}, ref) => {

  // Render Grid
  const renderGrid = () => {
    const grid = [];
    const ghostCells = new Set<string>();

    // Calculate Ghost positions based on parent's passed target
    if (draggedItem && hoverTarget) {
       draggedItem.shape.forEach((row, i) => {
         row.forEach((cell, j) => {
           if (cell === 1) {
             ghostCells.add(`${hoverTarget.r + i}-${hoverTarget.c + j}`);
           }
         });
       });
    }

    for (let r = 0; r < container.gridHeight; r++) {
      for (let c = 0; c < container.gridWidth; c++) {
        const cellId = `${r}-${c}`;
        const occupiedId = container.gridState[r][c];
        const isGhost = ghostCells.has(cellId);

        let cellContent = null;
        let cellClass = "bg-stone-200/50 shadow-inner"; // Empty slot style

        if (occupiedId) {
           // Basic styling for filled cells
           cellClass = "bg-stone-600 shadow-sm border border-white/20"; 
        } else if (isGhost) {
          cellClass = hoverTarget?.isValid ? "bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-rose-400/80 shadow-[0_0_10px_rgba(251,113,133,0.5)]";
        }

        grid.push(
          <div 
            key={cellId}
            className={`rounded-sm transition-colors duration-100 ${cellClass}`}
            style={{ width: CELL_SIZE - 2, height: CELL_SIZE - 2 }} // -2 for gap
          />
        );
      }
    }
    return grid;
  };

  // Count fill percentage
  const filledCells = container.gridState.flat().filter(Boolean).length;
  const totalCells = container.gridWidth * container.gridHeight;
  const fillPercent = Math.round((filledCells / totalCells) * 100);

  return (
    <div 
      ref={ref}
      data-id={container.id}
      className={`
        relative p-3 rounded-xl border-4 transition-all duration-300
        flex flex-col items-center justify-between
        ${container.themeColor} 
        ${container.isClosing ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        shadow-lg select-none
        ${hoverTarget?.isValid ? 'ring-4 ring-emerald-300 ring-offset-2' : ''}
      `}
      style={{ minWidth: 'min-content' }}
    >
      {/* Label */}
      <div className="absolute -top-3 bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm border border-stone-200 z-20 whitespace-nowrap flex gap-2">
        <span>{container.label}</span>
        <span className={fillPercent === 100 ? "text-green-600" : "text-stone-400"}>{fillPercent}%</span>
      </div>

      {/* Grid Area */}
      <div 
        className="grid gap-[2px] bg-black/5 p-2 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${container.gridWidth}, ${CELL_SIZE}px)`,
        }}
      >
        {renderGrid()}
      </div>

      {/* Controls */}
      <div className="mt-2 w-full flex justify-center">
        <button 
          onClick={() => onPack(container.id)}
          className={`
            text-xs px-4 py-1.5 rounded-full font-bold active:scale-95 transition-all shadow-md flex items-center gap-1
            ${fillPercent === 100 
              ? 'bg-green-600 text-white hover:bg-green-500 animate-pulse' 
              : 'bg-stone-800 text-white hover:bg-stone-700'}
          `}
        >
          <span>📦</span> {translations.packBtn || "Pack"}
        </button>
      </div>
    </div>
  );
});

ContainerBox.displayName = 'ContainerBox';
