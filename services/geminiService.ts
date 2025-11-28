
import { GoogleGenAI, Type } from "@google/genai";
import { LevelTheme, ItemType, Language, ShapeMatrix, GameItem } from "../types";
import { v4 as uuidv4 } from 'uuid';

// Use process.env.API_KEY exclusively as per guidelines.
// This assumes process.env.API_KEY is available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define a rich variety of shapes
// All shapes must be orthogonally connected (edge-to-edge), no diagonal-only connections.
const SHAPES: Record<string, ShapeMatrix> = {
  // --- 1 to 3 blocks (Small) ---
  '1x1': [[1]],
  '1x2': [[1, 1]],
  '2x1': [[1], [1]],
  '3x1': [[1], [1], [1]],
  '1x3': [[1, 1, 1]],
  'Corner-Sm': [[1, 0], [1, 1]], 
  'Small-T': [[1, 1, 1], [0, 1, 0]], 

  // --- 4 blocks (Medium / Tetrominoes) ---
  '2x2': [[1, 1], [1, 1]],
  '4x1': [[1], [1], [1], [1]],
  '1x4': [[1, 1, 1, 1]],
  'L': [[1, 0], [1, 0], [1, 1]],
  'J': [[0, 1], [0, 1], [1, 1]],
  'T': [[1, 1, 1], [0, 1, 0]],
  'Z': [[1, 1, 0], [0, 1, 1]],
  'S': [[0, 1, 1], [1, 1, 0]],
  'Podium': [[0, 1, 0], [1, 1, 1]],
  
  // --- 5+ blocks (Large / Complex) ---
  'P-Up': [[1, 1], [1, 1], [1, 0]],
  'P-Down': [[1, 0], [1, 1], [1, 1]],
  'U-Sm': [[1, 0, 1], [1, 1, 1]],
  'Plus': [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
  'W': [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
  'Stairs': [[1, 0, 0], [1, 1, 0], [0, 1, 1]],
  'Chair': [[1, 1, 0], [0, 1, 0], [0, 1, 1]],
  'Long-L': [[1, 0], [1, 0], [1, 0], [1, 1]],
  'Snake': [[1, 1, 0, 0], [0, 1, 1, 1]],
  '2x3': [[1, 1], [1, 1], [1, 1]],
  '3x2': [[1, 1, 1], [1, 1, 1]],
  'H': [[1, 0, 1], [1, 1, 1], [1, 0, 1]],
  'Donut': [[1, 1, 1], [1, 0, 1], [1, 1, 1]], 
  'Big-L': [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
  'Pyramid': [[0, 0, 1, 0, 0], [0, 1, 1, 1, 0], [1, 1, 1, 1, 1]],
  'C-Shape': [[1, 1, 1], [1, 0, 0], [1, 1, 1]],
  '3x3': [[1, 1, 1], [1, 1, 1], [1, 1, 1]], 
  '2x4': [[1, 1], [1, 1], [1, 1], [1, 1]],
};

// Categorize keys for weighted generation
const KEYS_SMALL = ['1x1', '1x2', '2x1', '3x1', '1x3', 'Corner-Sm', 'Small-T'];
const KEYS_MEDIUM = ['2x2', '4x1', '1x4', 'L', 'J', 'T', 'Z', 'S', 'Podium'];
const KEYS_LARGE = ['P-Up', 'P-Down', 'U-Sm', 'Plus', 'W', 'Stairs', 'Chair', 'Long-L', 'Snake', '2x3', '3x2', 'H', 'Donut', 'Big-L', 'Pyramid', 'C-Shape', '3x3', '2x4'];

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-yellow-400', 
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

export const getRandomShape = (): { matrix: ShapeMatrix, name: string } => {
  const rand = Math.random();
  let pool: string[] = [];

  // Weighted Logic:
  // 60% Small
  // 30% Medium
  // 10% Large
  if (rand < 0.60) {
    pool = KEYS_SMALL;
  } else if (rand < 0.90) {
    pool = KEYS_MEDIUM;
  } else {
    pool = KEYS_LARGE;
  }

  const key = pool[Math.floor(Math.random() * pool.length)];
  return { matrix: SHAPES[key], name: key };
};

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// --- Helper for Stacking Logic ---
export const generateStackedItems = (theme: LevelTheme, roomW: number, roomH: number, count: number): GameItem[] => {
  const items: GameItem[] = [];
  // Elevation map: stores the current height (layer count) at each cell [y][x]
  const heightMap: number[][] = Array(roomH).fill(0).map(() => Array(roomW).fill(0));

  for (let i = 0; i < count; i++) {
    const themeItem = theme.items[Math.floor(Math.random() * theme.items.length)];
    const { matrix } = getRandomShape();
    const itemH = matrix.length;
    const itemW = matrix[0].length;
    
    // Try to find a valid position
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 50) {
      attempts++;
      
      // Random position
      const gridX = Math.floor(Math.random() * (roomW - itemW + 1));
      const gridY = Math.floor(Math.random() * (roomH - itemH + 1));

      // Calculate the required layer for this position
      // It must be on top of the highest thing currently in its footprint
      let maxElevationUnderneath = 0;
      
      for (let r = 0; r < itemH; r++) {
        for (let c = 0; c < itemW; c++) {
          if (matrix[r][c] === 1) {
            maxElevationUnderneath = Math.max(maxElevationUnderneath, heightMap[gridY + r][gridX + c]);
          }
        }
      }

      // To make it look like a messy pile, we accept this position
      // The layer will be maxElevation + 1
      const layer = maxElevationUnderneath; 

      // Update the item
      items.push({
        id: uuidv4(),
        name: themeItem.name,
        emoji: themeItem.emoji,
        type: themeItem.type,
        gridX,
        gridY,
        rotation: 0, // Keep rotation 0 for logic simplicity in this version
        scale: 1,
        layer: layer,
        isBlocked: false, // Will be calculated globally later
        shape: matrix,
        colorClass: getRandomColor()
      });

      // Update height map
      for (let r = 0; r < itemH; r++) {
        for (let c = 0; c < itemW; c++) {
          if (matrix[r][c] === 1) {
            heightMap[gridY + r][gridX + c] = layer + 1;
          }
        }
      }
      placed = true;
    }
  }

  // Sort by layer for rendering order (though z-index handles it mostly)
  return items.sort((a, b) => a.layer - b.layer);
};


const getFallbackTheme = (lang: Language): LevelTheme => {
  const isZh = lang === 'zh-CN';
  return {
    name: isZh ? "凌乱的卧室 (离线模式)" : "Messy Bedroom (Offline)",
    description: isZh ? "没有检测到API Key，正在使用默认主题。" : "No API Key detected, using default theme.",
    backgroundGradient: "from-blue-100 to-indigo-50",
    items: [
      { type: ItemType.BOOK, emoji: "📚", name: isZh ? "课本" : "Textbook" },
      { type: ItemType.BOOK, emoji: "📕", name: isZh ? "小说" : "Novel" },
      { type: ItemType.TOY, emoji: "🧸", name: isZh ? "泰迪熊" : "Bear" },
      { type: ItemType.TOY, emoji: "🚗", name: isZh ? "玩具车" : "Car" },
      { type: ItemType.CLOTHING, emoji: "👕", name: isZh ? "衬衫" : "Shirt" },
      { type: ItemType.CLOTHING, emoji: "🧦", name: isZh ? "袜子" : "Socks" },
      { type: ItemType.PLANT, emoji: "🌵", name: isZh ? "仙人掌" : "Cactus" },
      { type: ItemType.ELECTRONIC, emoji: "📱", name: isZh ? "手机" : "Phone" },
    ]
  };
};

export const generateLevelTheme = async (lang: Language): Promise<LevelTheme> => {
  // Check if we have a valid key
  if (!process.env.API_KEY) {
    console.warn("No valid API Key found. Using fallback theme.");
    return getFallbackTheme(lang);
  }

  try {
    const langPrompt = lang === 'zh-CN' ? 'Simplified Chinese' : 'English';
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a creative and cozy theme for a room organizing game. Provide a list of item types (mapped to general categories) and specific emojis to represent them. The output must be JSON. Language: ${langPrompt}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Creative name of the room/theme" },
            description: { type: Type.STRING, description: "Short flavor text" },
            backgroundGradient: { type: Type.STRING, description: "Tailwind gradient classes e.g. 'from-purple-100 to-pink-50'" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { 
                    type: Type.STRING, 
                    enum: Object.values(ItemType),
                    description: "The logic category of the item"
                  },
                  emoji: { type: Type.STRING, description: "A single emoji" },
                  name: { type: Type.STRING, description: "Name of the object" }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as LevelTheme;
    }
    return getFallbackTheme(lang);
  } catch (error) {
    console.warn("Gemini generation failed, using fallback.", error);
    return getFallbackTheme(lang);
  }
};
