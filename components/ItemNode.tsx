import React, { useState } from 'react';
import { GameItem } from '../types';

interface ItemNodeProps {
  item: GameItem;
  roomCellSize: number;
  onDragStart: (e: React.MouseEvent | React.TouchEvent, item: GameItem) => void;
  isDragging: boolean;
}

export const ItemNode: React.FC<ItemNodeProps> = ({ item, roomCellSize, onDragStart, isDragging }) => {
  const [isHovered, setIsHovered] = useState(false);

  const left = item.gridX * roomCellSize;
  const top = item.gridY * roomCellSize;
  
  return (
    <div
      onMouseDown={(e) => !item.isBlocked && onDragStart(e, item)}
      onTouchStart={(e) => !item.isBlocked && onDragStart(e, item)}
      className={`absolute transition-all duration-300 ease-out select-none pointer-events-none
        ${item.isBlocked 
          ? 'brightness-[0.4] grayscale opacity-90' 
          : isHovered 
            ? 'brightness-110 scale-[1.02] z-[50]' // Highlight whole item on hover
            : 'brightness-100'
        }
        ${isDragging ? 'opacity-0' : 'opacity-100'} 
      `}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: `rotate(${item.rotation}deg) scale(${item.scale})`,
        zIndex: isHovered && !item.isBlocked ? 50 : 10 + item.layer, // Bring hovered item to front visually if not blocked
        touchAction: 'none'
      }}
    >
      <div 
        className="relative"
        style={{
           display: 'grid',
           gridTemplateColumns: `repeat(${item.shape[0].length}, ${roomCellSize}px)`,
           gap: '0px',
           // VISUAL STYLE: Strong glowing outline
           filter: 'drop-shadow(0 0 1px white) drop-shadow(0 0 4px rgba(255, 255, 255, 1))'
        }}
      >
        {item.shape.map((row, rIndex) => (
          row.map((cell, cIndex) => {
            if (cell === 0) return <div key={`${rIndex}-${cIndex}`} style={{width: roomCellSize, height: roomCellSize}} />;
            return (
              <div 
                key={`${rIndex}-${cIndex}`}
                // Trigger whole-item hover state
                onMouseEnter={() => !item.isBlocked && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                // EVENT LOGIC CHANGE: Only filled cells capture events (pointer-events-auto)
                className={`
                  pointer-events-auto
                  rounded-sm shadow-sm ${item.colorClass} 
                  border border-black/5
                  ${!item.isBlocked ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}
                `}
                style={{ width: roomCellSize, height: roomCellSize }}
              >
                {/* Inner highlight logic simplified: weak inner lines */}
                <div className="w-full h-full border-t border-l border-white/30 rounded-sm"></div>
              </div>
            );
          })
        ))}
        
        {item.isBlocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-white/60 text-2xl drop-shadow-md">🔒</div>
          </div>
        )}
      </div>
    </div>
  );
};