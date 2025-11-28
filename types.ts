
export enum ItemType {
  BOOK = 'BOOK',
  TOY = 'TOY',
  CLOTHING = 'CLOTHING',
  KITCHEN = 'KITCHEN',
  PLANT = 'PLANT',
  TOOL = 'TOOL',
  ELECTRONIC = 'ELECTRONIC',
  MISC = 'MISC'
}

export type Language = 'en' | 'zh-CN';

// A generic 2D matrix for shapes (1 = filled, 0 = empty)
export type ShapeMatrix = number[][];

export interface ItemShape {
  matrix: ShapeMatrix;
  width: number;
  height: number;
}

export interface GameItem {
  id: string;
  name: string;
  emoji: string;
  type: ItemType;
  
  // Grid Positioning (Room Coordinates)
  gridX: number; // Integer column index
  gridY: number; // Integer row index
  layer: number; // Z-index / Stacking order (0 is floor)
  
  rotation: number; // Visual rotation (0, 90, 180, 270)
  
  scale: number;
  isBlocked: boolean; // Calculated at runtime
  
  // Grid Mechanics
  shape: ShapeMatrix; 
  colorClass: string; // Tailwind color for the blocks
}

export interface GameContainer {
  id: string;
  acceptedType: ItemType; 
  label: string;
  themeColor: string; // New: Specific color style for this box
  
  // Grid Mechanics
  gridWidth: number;
  gridHeight: number;
  gridState: (string | null)[][]; 
  
  isClosing: boolean;
  isPacked: boolean; 
}

export interface LevelTheme {
  name: string;
  description: string;
  items: {
    type: ItemType;
    emoji: string;
    name: string;
  }[];
  backgroundGradient: string;
}

export interface DragItemState {
  item: GameItem;
  origin: 'FLOOR' | 'CONTAINER'; 
}

/**
 * Rotates a binary matrix 90 degrees clockwise
 */
export const rotateShapeMatrix = (matrix: ShapeMatrix): ShapeMatrix => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  // Create new matrix with swapped dimensions
  const newMatrix: ShapeMatrix = Array(cols).fill(0).map(() => Array(rows).fill(0));
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // (r, c) -> (c, rows - 1 - r)
      newMatrix[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return newMatrix;
};
