
import { LevelTheme, ItemType, Language, ShapeMatrix, GameItem } from "../types";
import { v4 as uuidv4 } from 'uuid';

// --- DATA LIBRARY FOR PROCEDURAL GENERATION ---

// 1. Shapes Definition
// All shapes must be orthogonally connected.
const SHAPES: Record<string, ShapeMatrix> = {
  // --- Small (1-3) ---
  '1x1': [[1]],
  '1x2': [[1, 1]],
  '2x1': [[1], [1]],
  '3x1': [[1], [1], [1]],
  '1x3': [[1, 1, 1]],
  'Corner-Sm': [[1, 0], [1, 1]], 
  'Small-T': [[1, 1, 1], [0, 1, 0]], 

  // --- Medium (4) ---
  '2x2': [[1, 1], [1, 1]],
  '4x1': [[1], [1], [1], [1]],
  '1x4': [[1, 1, 1, 1]],
  'L': [[1, 0], [1, 0], [1, 1]],
  'J': [[0, 1], [0, 1], [1, 1]],
  'T': [[1, 1, 1], [0, 1, 0]],
  'Z': [[1, 1, 0], [0, 1, 1]],
  'S': [[0, 1, 1], [1, 1, 0]],
  'Podium': [[0, 1, 0], [1, 1, 1]],
  
  // --- Large (5+) ---
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

const KEYS_SMALL = ['1x1', '1x2', '2x1', '3x1', '1x3', 'Corner-Sm', 'Small-T'];
const KEYS_MEDIUM = ['2x2', '4x1', '1x4', 'L', 'J', 'T', 'Z', 'S', 'Podium'];
const KEYS_LARGE = ['P-Up', 'P-Down', 'U-Sm', 'Plus', 'W', 'Stairs', 'Chair', 'Long-L', 'Snake', '2x3', '3x2', 'H', 'Donut', 'Big-L', 'Pyramid', 'C-Shape', '3x3', '2x4'];

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-yellow-400', 
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

const GRADIENTS = [
  "from-blue-100 to-indigo-50",
  "from-orange-100 to-yellow-50",
  "from-green-100 to-emerald-50",
  "from-gray-200 to-slate-100",
  "from-pink-100 to-rose-50",
  "from-purple-100 to-fuchsia-50",
  "from-teal-100 to-cyan-50",
  "from-amber-100 to-orange-50"
];

// 2. Item Library (Multilingual)
// Maps ItemType -> List of {emoji, nameEN, nameZH}
const ITEM_LIBRARY: Record<ItemType, {emoji: string, name: Record<Language, string>}[]> = {
  [ItemType.BOOK]: [
    { emoji: "📚", name: { en: "Textbook", "zh-CN": "课本" } },
    { emoji: "📕", name: { en: "Novel", "zh-CN": "小说" } },
    { emoji: "📗", name: { en: "Journal", "zh-CN": "日记本" } },
    { emoji: "📘", name: { en: "Manual", "zh-CN": "手册" } },
    { emoji: "📜", name: { en: "Scroll", "zh-CN": "卷轴" } },
  ],
  [ItemType.TOY]: [
    { emoji: "🧸", name: { en: "Bear", "zh-CN": "泰迪熊" } },
    { emoji: "🚗", name: { en: "Car", "zh-CN": "玩具车" } },
    { emoji: "🤖", name: { en: "Robot", "zh-CN": "机器人" } },
    { emoji: "🦕", name: { en: "Dino", "zh-CN": "恐龙" } },
    { emoji: "🎲", name: { en: "Dice", "zh-CN": "骰子" } },
    { emoji: "🧩", name: { en: "Puzzle", "zh-CN": "拼图" } },
  ],
  [ItemType.CLOTHING]: [
    { emoji: "👕", name: { en: "Shirt", "zh-CN": "衬衫" } },
    { emoji: "🧦", name: { en: "Socks", "zh-CN": "袜子" } },
    { emoji: "👗", name: { en: "Dress", "zh-CN": "裙子" } },
    { emoji: "🧢", name: { en: "Cap", "zh-CN": "帽子" } },
    { emoji: "👟", name: { en: "Sneaker", "zh-CN": "运动鞋" } },
    { emoji: "🧤", name: { en: "Gloves", "zh-CN": "手套" } },
  ],
  [ItemType.KITCHEN]: [
    { emoji: "🍳", name: { en: "Pan", "zh-CN": "平底锅" } },
    { emoji: "🥣", name: { en: "Bowl", "zh-CN": "碗" } },
    { emoji: "🥢", name: { en: "Chopsticks", "zh-CN": "筷子" } },
    { emoji: "🥄", name: { en: "Spoon", "zh-CN": "勺子" } },
    { emoji: "🧂", name: { en: "Salt", "zh-CN": "盐瓶" } },
    { emoji: "🍎", name: { en: "Apple", "zh-CN": "苹果" } },
    { emoji: "🥕", name: { en: "Carrot", "zh-CN": "胡萝卜" } },
    { emoji: "🍞", name: { en: "Bread", "zh-CN": "面包" } },
  ],
  [ItemType.PLANT]: [
    { emoji: "🌵", name: { en: "Cactus", "zh-CN": "仙人掌" } },
    { emoji: "🪴", name: { en: "Potted Plant", "zh-CN": "盆栽" } },
    { emoji: "🌻", name: { en: "Sunflower", "zh-CN": "向日葵" } },
    { emoji: "🌹", name: { en: "Rose", "zh-CN": "玫瑰" } },
    { emoji: "🍁", name: { en: "Leaf", "zh-CN": "枫叶" } },
  ],
  [ItemType.TOOL]: [
    { emoji: "🔨", name: { en: "Hammer", "zh-CN": "锤子" } },
    { emoji: "🔧", name: { en: "Wrench", "zh-CN": "扳手" } },
    { emoji: "🪛", name: { en: "Screwdriver", "zh-CN": "螺丝刀" } },
    { emoji: "✂️", name: { en: "Scissors", "zh-CN": "剪刀" } },
    { emoji: "🔦", name: { en: "Flashlight", "zh-CN": "手电筒" } },
  ],
  [ItemType.ELECTRONIC]: [
    { emoji: "📱", name: { en: "Phone", "zh-CN": "手机" } },
    { emoji: "💻", name: { en: "Laptop", "zh-CN": "笔记本" } },
    { emoji: "🖱️", name: { en: "Mouse", "zh-CN": "鼠标" } },
    { emoji: "🎧", name: { en: "Headphones", "zh-CN": "耳机" } },
    { emoji: "📷", name: { en: "Camera", "zh-CN": "相机" } },
    { emoji: "💾", name: { en: "Floppy", "zh-CN": "软盘" } },
  ],
  [ItemType.MISC]: [
    { emoji: "🔑", name: { en: "Key", "zh-CN": "钥匙" } },
    { emoji: "📦", name: { en: "Box", "zh-CN": "盒子" } },
    { emoji: "💎", name: { en: "Gem", "zh-CN": "宝石" } },
    { emoji: "🎨", name: { en: "Palette", "zh-CN": "调色板" } },
    { emoji: "🎸", name: { en: "Guitar", "zh-CN": "吉他" } },
    { emoji: "🧸", name: { en: "Doll", "zh-CN": "玩偶" } },
  ]
};

// 3. Room Templates
interface RoomTemplate {
  name: Record<Language, string>;
  primaryTypes: ItemType[];
}

const ROOM_TEMPLATES: RoomTemplate[] = [
  { 
    name: { en: "Bedroom", "zh-CN": "卧室" }, 
    primaryTypes: [ItemType.CLOTHING, ItemType.BOOK, ItemType.TOY, ItemType.ELECTRONIC] 
  },
  { 
    name: { en: "Kitchen", "zh-CN": "厨房" }, 
    primaryTypes: [ItemType.KITCHEN, ItemType.PLANT] 
  },
  { 
    name: { en: "Garden Shed", "zh-CN": "花园小屋" }, 
    primaryTypes: [ItemType.TOOL, ItemType.PLANT, ItemType.MISC] 
  },
  { 
    name: { en: "Office", "zh-CN": "办公室" }, 
    primaryTypes: [ItemType.BOOK, ItemType.ELECTRONIC, ItemType.MISC] 
  },
  { 
    name: { en: "Playroom", "zh-CN": "游戏室" }, 
    primaryTypes: [ItemType.TOY, ItemType.ELECTRONIC, ItemType.MISC] 
  },
  { 
    name: { en: "Garage", "zh-CN": "车库" }, 
    primaryTypes: [ItemType.TOOL, ItemType.MISC, ItemType.ELECTRONIC] 
  },
];

const ADJECTIVES: Record<Language, string[]> = {
  en: ["Messy", "Cozy", "Tiny", "Sunny", "Grandpa's", "Magic", "Cyberpunk", "Dusty", "Colorful", "Secret"],
  "zh-CN": ["凌乱的", "温馨的", "小小的", "阳光明媚的", "爷爷的", "魔法", "赛博朋克", "积灰的", "五彩斑斓的", "秘密"]
};


// --- GENERATION LOGIC ---

export const getRandomShape = (): { matrix: ShapeMatrix, name: string } => {
  const rand = Math.random();
  let pool: string[] = [];
  if (rand < 0.60) pool = KEYS_SMALL;
  else if (rand < 0.90) pool = KEYS_MEDIUM;
  else pool = KEYS_LARGE;
  const key = pool[Math.floor(Math.random() * pool.length)];
  return { matrix: SHAPES[key], name: key };
};

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export const generateStackedItems = (theme: LevelTheme, roomW: number, roomH: number, count: number): GameItem[] => {
  const items: GameItem[] = [];
  const heightMap: number[][] = Array(roomH).fill(0).map(() => Array(roomW).fill(0));

  for (let i = 0; i < count; i++) {
    const themeItem = theme.items[Math.floor(Math.random() * theme.items.length)];
    const { matrix } = getRandomShape();
    const itemH = matrix.length;
    const itemW = matrix[0].length;
    
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 50) {
      attempts++;
      const gridX = Math.floor(Math.random() * (roomW - itemW + 1));
      const gridY = Math.floor(Math.random() * (roomH - itemH + 1));

      let maxElevationUnderneath = 0;
      for (let r = 0; r < itemH; r++) {
        for (let c = 0; c < itemW; c++) {
          if (matrix[r][c] === 1) {
            maxElevationUnderneath = Math.max(maxElevationUnderneath, heightMap[gridY + r][gridX + c]);
          }
        }
      }

      const layer = maxElevationUnderneath; 
      items.push({
        id: uuidv4(),
        name: themeItem.name,
        emoji: themeItem.emoji,
        type: themeItem.type,
        gridX,
        gridY,
        rotation: 0,
        scale: 1,
        layer: layer,
        isBlocked: false,
        shape: matrix,
        colorClass: getRandomColor()
      });

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
  return items.sort((a, b) => a.layer - b.layer);
};

export const generateLevelTheme = async (lang: Language): Promise<LevelTheme> => {
  // Purely procedural generation - No API Key required, no delays.
  
  // 1. Pick a template
  const template = ROOM_TEMPLATES[Math.floor(Math.random() * ROOM_TEMPLATES.length)];
  
  // 2. Pick an adjective
  const adj = ADJECTIVES[lang][Math.floor(Math.random() * ADJECTIVES[lang].length)];
  
  // 3. Construct name
  const themeName = lang === 'zh-CN' 
    ? `${adj}${template.name[lang]}` 
    : `${adj} ${template.name[lang]}`;
    
  // 4. Construct Description
  const descriptions: Record<Language, string[]> = {
    "zh-CN": [
      "这里太乱了，快来收拾一下！",
      "这么多东西，箱子够用吗？",
      "小心不要把东西弄坏了。",
      "看着整洁的房间真舒服。"
    ],
    en: [
      "It's a total mess in here!",
      "Are there enough boxes?",
      "Be careful with these items.",
      "Nothing beats a clean room."
    ]
  };
  const desc = descriptions[lang][Math.floor(Math.random() * descriptions[lang].length)];

  // 5. Build Item List
  // 70% chance to pick from primary types, 30% from any random type
  const themeItems: { type: ItemType; emoji: string; name: string }[] = [];
  
  // We want to generate a pool of items for this level
  const POOL_SIZE = 8; // Number of unique item types available in this level
  
  for (let i = 0; i < POOL_SIZE; i++) {
    let targetType: ItemType;
    if (Math.random() < 0.7) {
      targetType = template.primaryTypes[Math.floor(Math.random() * template.primaryTypes.length)];
    } else {
      const allTypes = Object.values(ItemType);
      targetType = allTypes[Math.floor(Math.random() * allTypes.length)];
    }
    
    const possibleItems = ITEM_LIBRARY[targetType];
    const specificItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    
    themeItems.push({
      type: targetType,
      emoji: specificItem.emoji,
      name: specificItem.name[lang]
    });
  }

  // 6. Pick Background
  const gradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];

  // Simulate a tiny delay for UI transition effect (optional, can be 0)
  // await new Promise(r => setTimeout(r, 100));

  return {
    name: themeName,
    description: desc,
    items: themeItems,
    backgroundGradient: gradient
  };
};
