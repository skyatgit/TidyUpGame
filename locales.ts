
import { ItemType, Language } from './types';

export const translations: Record<Language, any> = {
  en: {
    title: "TidyUp!",
    subtitle: "Cozy Organizing",
    startDescription: "Items are stacked in the messy room! You can only pick up items that are on top (not blocked by others). Pack them into boxes to clear the room.",
    startBtn: "Start Cleaning",
    generating: "Generating Room...",
    score: "SCORE",
    remaining: "Items Left",
    cleared: "Room Cleared!",
    nextBtn: "Next Room",
    clean: "CLEAN!",
    packBtn: "Pack It",
    addBox: "New Box",
    boxes: "Active Boxes",
    inQueue: "waiting",
    boxLabel: "Storage Box",
    rotateHint: "Drag & press 'R' to spin",
    noBox: "Empty",
    itemTypes: {
      [ItemType.BOOK]: "Books",
      [ItemType.TOY]: "Toys",
      [ItemType.CLOTHING]: "Clothes",
      [ItemType.KITCHEN]: "Kitchen",
      [ItemType.PLANT]: "Plants",
      [ItemType.TOOL]: "Tools",
      [ItemType.ELECTRONIC]: "Tech",
      [ItemType.MISC]: "Misc"
    }
  },
  'zh-CN': {
    title: "收纳大师",
    subtitle: "治愈系整理",
    startDescription: "房间里的物品堆积如山！你只能移动最上面的物品（未被其他物品遮挡的）。将它们装箱整理吧。",
    startBtn: "开始整理",
    generating: "正在生成房间...",
    score: "分数",
    remaining: "剩余物品",
    cleared: "整理完毕！",
    nextBtn: "前往下一个房间",
    clean: "干净！",
    packBtn: "打包",
    addBox: "新箱子",
    boxes: "当前箱子",
    inQueue: "待命",
    boxLabel: "收纳箱",
    rotateHint: "拖拽时按 R 键旋转",
    noBox: "已空",
    itemTypes: {
      [ItemType.BOOK]: "书籍",
      [ItemType.TOY]: "玩具",
      [ItemType.CLOTHING]: "衣物",
      [ItemType.KITCHEN]: "厨具",
      [ItemType.PLANT]: "植物",
      [ItemType.TOOL]: "工具",
      [ItemType.ELECTRONIC]: "电子产品",
      [ItemType.MISC]: "杂物"
    }
  }
};
