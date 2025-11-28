import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateLevelTheme, generateStackedItems } from './services/geminiService';
import { GameItem, GameContainer, ItemType, LevelTheme, Language, rotateShapeMatrix } from './types';
import { ItemNode } from './components/ItemNode';
import { ContainerBox } from './components/ContainerBox';
import { translations } from './locales';
import { v4 as uuidv4 } from 'uuid';

const ACTIVE_CONTAINER_LIMIT = 3;
const ITEMS_PER_LEVEL = 35; 
const BASE_CONTAINER_CELL_SIZE = 34; 
const BASE_ROOM_CELL_SIZE = 34;
const ROOM_W = 10;
const ROOM_H = 10;

// Color themes for boxes
const BOX_THEMES = [
  'bg-stone-50 border-stone-200',
  'bg-red-50 border-red-200',
  'bg-orange-50 border-orange-200',
  'bg-amber-50 border-amber-200',
  'bg-yellow-50 border-yellow-200',
  'bg-lime-50 border-lime-200',
  'bg-green-50 border-green-200',
  'bg-emerald-50 border-emerald-200',
  'bg-teal-50 border-teal-200',
  'bg-cyan-50 border-cyan-200',
  'bg-sky-50 border-sky-200',
  'bg-blue-50 border-blue-200',
  'bg-indigo-50 border-indigo-200',
  'bg-violet-50 border-violet-200',
  'bg-purple-50 border-purple-200',
  'bg-fuchsia-50 border-fuchsia-200',
  'bg-pink-50 border-pink-200',
  'bg-rose-50 border-rose-200',
];

// --- Helper Functions ---

const createContainer = (availableTypes: ItemType[], lang: Language): GameContainer => {
  // Random dimensions
  // 3 to 6
  const w = Math.floor(Math.random() * 4) + 3; 
  const h = Math.floor(Math.random() * 4) + 3; 
  
  // Create empty grid
  const grid = Array(h).fill(null).map(() => Array(w).fill(null));
  
  // Pick random color theme
  const randomTheme = BOX_THEMES[Math.floor(Math.random() * BOX_THEMES.length)];

  return {
    id: uuidv4(),
    acceptedType: ItemType.MISC, // Generic type, no restriction
    label: translations[lang].boxLabel || "Box",
    gridWidth: w,
    gridHeight: h,
    gridState: grid,
    isClosing: false,
    isPacked: false,
    themeColor: randomTheme
  };
};

// Check if Item A is blocked by Item B
const isObstructed = (itemA: GameItem, itemB: GameItem): boolean => {
  if (itemB.layer <= itemA.layer) return false; // Only things above can block

  // Check overlap logic using grid coordinates + shape matrices
  // Iterate through Item A's filled cells relative to the room
  for (let rA = 0; rA < itemA.shape.length; rA++) {
    for (let cA = 0; cA < itemA.shape[0].length; cA++) {
      if (itemA.shape[rA][cA] === 1) {
        const roomX_A = itemA.gridX + cA;
        const roomY_A = itemA.gridY + rA;

        // Check against Item B's filled cells
        for (let rB = 0; rB < itemB.shape.length; rB++) {
          for (let cB = 0; cB < itemB.shape[0].length; cB++) {
            if (itemB.shape[rB][cB] === 1) {
              const roomX_B = itemB.gridX + cB;
              const roomY_B = itemB.gridY + rB;

              // Collision found directly above
              if (roomX_A === roomX_B && roomY_A === roomY_B) {
                return true;
              }
            }
          }
        }
      }
    }
  }
  return false;
};

// Check if an item overlaps with any other item in a list (used for rotation validation)
const checkCollision = (subject: GameItem, others: GameItem[], roomW: number, roomH: number): boolean => {
  // 1. Check Bounds
  if (subject.gridX < 0 || subject.gridY < 0) return true;
  if (subject.gridX + subject.shape[0].length > roomW) return true;
  if (subject.gridY + subject.shape.length > roomH) return true;

  // 2. Check overlap with others on SAME layer
  // (We assume rotation doesn't change layer, so we check if the new footprint hits anyone else)
  for (const other of others) {
    if (other.id === subject.id) continue;
    
    // Only care about items that could intersect physically (simplified: same layer)
    // In a full 3D physics sim we'd check volumes, but here "layer" is a discrete Z-index.
    // If we rotate on layer L, we can't intersect another object on layer L.
    if (Math.abs(other.layer - subject.layer) < 0.1) {
        for (let rS = 0; rS < subject.shape.length; rS++) {
            for (let cS = 0; cS < subject.shape[0].length; cS++) {
                if (subject.shape[rS][cS] === 1) {
                    const absX = subject.gridX + cS;
                    const absY = subject.gridY + rS;

                    // Check 'other'
                    for (let rO = 0; rO < other.shape.length; rO++) {
                        for (let cO = 0; cO < other.shape[0].length; cO++) {
                            if (other.shape[rO][cO] === 1) {
                                if (other.gridX + cO === absX && other.gridY + rO === absY) {
                                    return true; // Collision
                                }
                            }
                        }
                    }
                }
            }
        }
    }
  }
  return false;
}

export default function App() {
  const [lang, setLang] = useState<Language>('zh-CN');
  const [theme, setTheme] = useState<LevelTheme | null>(null);
  const [items, setItems] = useState<GameItem[]>([]);
  
  // Changed: slots can be null. Fixed size array of 3.
  const [containerSlots, setContainerSlots] = useState<(GameContainer | null)[]>([null, null, null]);
  const [containerQueue, setContainerQueue] = useState<GameContainer[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Dragging State
  const [draggedItem, setDraggedItem] = useState<GameItem | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 }); // To distinguish click vs drag
  const [isDraggingActive, setIsDraggingActive] = useState(false);

  // This state tracks which container (and which cell) is currently being hovered
  const [hoverTarget, setHoverTarget] = useState<{ containerId: string, r: number, c: number, isValid: boolean } | null>(null);

  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [viewportWidth, setViewportWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [viewportHeight, setViewportHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 768);
  const activeTouchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSmallScreen = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const roomCellSize = Math.max(24, BASE_ROOM_CELL_SIZE * (isSmallScreen ? 0.65 : isTablet ? 0.85 : 1));
  const containerCellSize = Math.max(22, BASE_CONTAINER_CELL_SIZE * (isSmallScreen ? 0.7 : isTablet ? 0.85 : 1));

  // --- Game Logic ---

  // Recalculate blocked status for all items
  const updateBlockedStatus = (currentItems: GameItem[]) => {
    return currentItems.map(item => {
      let blocked = false;
      for (const other of currentItems) {
        if (item.id !== other.id && isObstructed(item, other)) {
          blocked = true;
          break;
        }
      }
      return { ...item, isBlocked: blocked };
    });
  };

  const startGame = async () => {
    setIsLoading(true);
    setGameOver(false);
    setScore(0);
    setItems([]);
    setContainerSlots([null, null, null]);
    setContainerQueue([]);

    const newTheme = await generateLevelTheme(lang);
    setTheme(newTheme);

    // Generate Items
    const rawItems = generateStackedItems(newTheme, ROOM_W, ROOM_H, ITEMS_PER_LEVEL);
    setItems(updateBlockedStatus(rawItems));

    // Generate Initial Containers
    const availableTypes = Array.from(new Set(newTheme.items.map(i => i.type)));
    // REDUCED FROM 12 TO 6
    const initialQueue = Array(6).fill(null).map(() => createContainer(availableTypes, lang));
    
    // Fill first 3 slots
    const firstThree = initialQueue.slice(0, ACTIVE_CONTAINER_LIMIT);
    setContainerSlots(firstThree);
    
    setContainerQueue(initialQueue.slice(ACTIVE_CONTAINER_LIMIT));

    setIsLoading(false);
  };

  const handleAddContainer = (slotIndex: number) => {
    if (containerQueue.length > 0) {
      const next = containerQueue[0];
      setContainerSlots(prev => {
        const newSlots = [...prev];
        newSlots[slotIndex] = next;
        return newSlots;
      });
      setContainerQueue(prev => prev.slice(1));
    }
  };

  // --- Interaction Handlers ---

  const rotateItem = useCallback((item: GameItem) => {
    const newShape = rotateShapeMatrix(item.shape);
    return {
      ...item,
      shape: newShape,
      rotation: (item.rotation + 90) % 360
    };
  }, []);

  const rotateDraggedItem = useCallback(() => {
    setDraggedItem(prev => (prev ? rotateItem(prev) : null));
  }, [rotateItem]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, item: GameItem) => {
    if (item.isBlocked) return; 

    e.preventDefault(); 
    activeTouchIdRef.current = null;
    
    let clientX, clientY;
    if ('touches' in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      activeTouchIdRef.current = touch.identifier;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    setDraggedItem(item);
    setCursorPos({ x: clientX, y: clientY });
    setDragStartPos({ x: clientX, y: clientY });
    setIsDraggingActive(false); // Will become true after small movement
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggedItem) return;
    if ('touches' in e) {
      const activeId = activeTouchIdRef.current;
      if (activeId === null) return;
      const touch = Array.from(e.touches).find(t => t.identifier === activeId) || e.touches[0];
      if (!touch) return;
      e.preventDefault();
      setCursorPos({ x: touch.clientX, y: touch.clientY });
      var clientX = touch.clientX;
      var clientY = touch.clientY;
    } else {
      const mouseEvent = e as MouseEvent;
      setCursorPos({ x: mouseEvent.clientX, y: mouseEvent.clientY });
      var clientX = mouseEvent.clientX;
      var clientY = mouseEvent.clientY;
    }

    // Threshold for "Dragging" vs "Clicking"
    if (!isDraggingActive) {
      const dist = Math.hypot(clientX - dragStartPos.x, clientY - dragStartPos.y);
      if (dist > 5) setIsDraggingActive(true);
    }

    // --- Global Hit Testing ---
    
    let foundTarget: { containerId: string, r: number, c: number, isValid: boolean } | null = null;

    containerRefs.current.forEach((el, id) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const containerObj = containerSlots.find(c => c && c.id === id);
      if (!containerObj || containerObj.isPacked) return;

      if (
        clientX >= rect.left && 
        clientX <= rect.right && 
        clientY >= rect.top && 
        clientY <= rect.bottom
      ) {
        const gridPixelWidth = containerObj.gridWidth * containerCellSize;
        const gridStartY = rect.top + (isSmallScreen ? 24 : 30);
        const gridStartX = rect.left + (rect.width - gridPixelWidth) / 2;

        const relX = clientX - gridStartX;
        const relY = clientY - gridStartY;

        const itemW_px = draggedItem.shape[0].length * containerCellSize;
        const itemH_px = draggedItem.shape.length * containerCellSize;
        const effectiveX = relX - itemW_px / 2;
        const effectiveY = relY - itemH_px / 2;

        const targetC = Math.round(effectiveX / containerCellSize);
        const targetR = Math.round(effectiveY / containerCellSize);

        // Validate bounds
        if (targetC >= 0 && targetR >= 0 && 
            targetC + draggedItem.shape[0].length <= containerObj.gridWidth && 
            targetR + draggedItem.shape.length <= containerObj.gridHeight) {
          
          let isValid = true;
          
          // Check Grid Collisions
          if (isValid) {
            for (let r = 0; r < draggedItem.shape.length; r++) {
              for (let c = 0; c < draggedItem.shape[0].length; c++) {
                if (draggedItem.shape[r][c] === 1) {
                  if (containerObj.gridState[targetR + r] && 
                      containerObj.gridState[targetR + r][targetC + c] !== null) {
                    isValid = false;
                  }
                }
              }
            }
          }

          foundTarget = { containerId: id, r: targetR, c: targetC, isValid };
        }
      }
    });

    setHoverTarget(foundTarget);

  }, [draggedItem, containerSlots, dragStartPos, isDraggingActive, containerCellSize, isSmallScreen]);

  const handleDragEnd = useCallback((event?: MouseEvent | TouchEvent | null) => {
    if (!draggedItem) return;

    if (event && 'changedTouches' in event) {
      const activeId = activeTouchIdRef.current;
      if (activeId !== null) {
        const relevantTouchEnded = Array.from(event.changedTouches).some(t => t.identifier === activeId);
        if (!relevantTouchEnded) {
          return;
        }
      }
    }

    if (isDraggingActive) {
      if (hoverTarget && hoverTarget.isValid) {
        setContainerSlots(prev => prev.map(c => {
          if (c && c.id === hoverTarget.containerId) {
            const newGrid = c.gridState.map(row => [...row]);
            draggedItem.shape.forEach((row, r) => {
              row.forEach((cell, col) => {
                if (cell === 1) {
                  newGrid[hoverTarget.r + r][hoverTarget.c + col] = draggedItem.id;
                }
              });
            });
            return { ...c, gridState: newGrid };
          }
          return c;
        }));

        const remainingItems = items.filter(i => i.id !== draggedItem.id);
        setItems(updateBlockedStatus(remainingItems));
        setScore(s => s + 100);
        if (remainingItems.length === 0) {
          setGameOver(true);
        }
      }
    }

    setDraggedItem(null);
    setHoverTarget(null);
    setIsDraggingActive(false);
    activeTouchIdRef.current = null;
  }, [draggedItem, hoverTarget, isDraggingActive, items]);

  // Keyboard rotation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (draggedItem && (e.key === 'r' || e.key === 'R' || e.key === ' ')) {
         e.preventDefault();
         setDraggedItem(prev => prev ? rotateItem(prev) : null);
      }
    };
    
    const handleWheel = (e: WheelEvent) => {
        if (draggedItem) {
            setDraggedItem(prev => prev ? rotateItem(prev) : null);
        }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('wheel', handleWheel);
    }
  }, [draggedItem]);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => handleDragEnd(e);
    const handleTouchEnd = (e: TouchEvent) => handleDragEnd(e);
    const handleTouchCancel = (e: TouchEvent) => handleDragEnd(e);

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleDragMove, handleDragEnd]); // dependencies included

  const handlePackContainer = (id: string) => {
    setContainerSlots(prev => prev.map(c => 
      c && c.id === id ? { ...c, isClosing: true } : c
    ));
    
    // Clear the slot after animation
    setTimeout(() => {
      setContainerSlots(prev => prev.map(c => 
         c && c.id === id ? null : c 
      ));
      setScore(s => s + 500);
    }, 500);
  };

  // --- Render ---

  if (!theme && !isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-black text-stone-800 mb-2 tracking-tighter">{translations[lang].title}</h1>
        <p className="text-xl text-stone-500 mb-8">{translations[lang].subtitle}</p>
        
        <div className="flex gap-4 mb-8">
           <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-full border ${lang==='en'?'bg-stone-800 text-white':'bg-white'}`}>English</button>
           <button onClick={() => setLang('zh-CN')} className={`px-4 py-2 rounded-full border ${lang==='zh-CN'?'bg-stone-800 text-white':'bg-white'}`}>中文</button>
        </div>

        <button 
          onClick={startGame}
          className="bg-stone-800 text-white text-xl px-12 py-4 rounded-full hover:scale-105 transition-transform shadow-xl font-bold"
        >
          {translations[lang].startBtn}
        </button>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-gradient-to-br ${theme?.backgroundGradient || 'from-gray-100 to-gray-200'} select-none overflow-hidden flex flex-col ${isSmallScreen ? 'touch-manipulation' : 'touch-none'}`}>
      {/* Header Bar */}
      <div className={`flex-shrink-0 flex ${isSmallScreen ? 'flex-col gap-2 text-center' : 'justify-between items-center'} px-4 md:px-6 py-3 bg-white/40 backdrop-blur-sm shadow-sm z-30`}>
        <div>
          <h2 className={`${isSmallScreen ? 'text-lg' : 'text-xl'} font-bold text-stone-800`}>{theme?.name}</h2>
          <div className="text-xs text-stone-600">
             {translations[lang].rotateHint || "Drag & press 'R' to spin"}
          </div>
        </div>
        <div className={`flex ${isSmallScreen ? 'justify-center gap-4' : 'gap-6 text-right'}`}>
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase">{translations[lang].remaining}</div>
            <div className="text-lg font-black text-stone-800">{items.length}</div>
          </div>
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase">{translations[lang].score}</div>
            <div className="text-lg font-black text-emerald-600">{score}</div>
          </div>
        </div>
      </div>

      {/* Middle: Room Area */}
      <div className={`flex-1 relative flex items-center justify-center overflow-hidden w-full ${isSmallScreen ? 'p-2' : 'p-4'}`}>
        <div 
          className={`bg-white/40 backdrop-blur-sm rounded-xl border-4 md:border-8 border-stone-600 shadow-2xl relative box-content transition-transform duration-500 ease-out ${isSmallScreen ? 'scale-90' : ''}`}
          style={{ 
            width: ROOM_W * roomCellSize, 
            height: ROOM_H * roomCellSize,
          }}
        >
          {/* Grid Lines */}
             <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                  backgroundSize: `${roomCellSize}px ${roomCellSize}px`
                }}
             />

            {items.map(item => (
              <ItemNode 
                key={item.id} 
                item={item} 
                roomCellSize={roomCellSize}
                onDragStart={handleDragStart}
                isDragging={draggedItem?.id === item.id}
              />
            ))}

            {items.length === 0 && !isLoading && (
               <div className="absolute inset-0 flex items-center justify-center z-50">
                 <div className="bg-white/95 px-8 py-6 rounded-2xl shadow-2xl text-center animate-pop-in border border-emerald-100">
                   <div className="text-6xl mb-2">✨</div>
                   <h3 className="text-2xl font-bold text-stone-800 mb-2">{translations[lang].cleared}</h3>
                   <div className="text-stone-500 mb-6 font-bold">{translations[lang].score}: {score}</div>
                   <button 
                     onClick={startGame}
                     className="bg-emerald-500 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-600 shadow-lg hover:shadow-xl transition-all active:scale-95"
                   >
                     {translations[lang].nextBtn}
                   </button>
                 </div>
               </div>
            )}
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
                <div className="flex flex-col items-center">
                  <div className="animate-spin text-4xl mb-2">🪄</div>
                  <div className="animate-pulse font-bold text-stone-500">{translations[lang].generating}</div>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* Bottom: Containers Workarea */}
      <div className={`flex-shrink-0 w-full bg-stone-100/80 backdrop-blur-xl border-t border-stone-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20 flex flex-col ${isSmallScreen ? 'max-h-[45%] overflow-y-auto' : ''}`}>
           <div className="flex justify-between items-center px-4 py-1 bg-white/50 border-b border-stone-200/50">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{translations[lang].boxes}</span>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {translations[lang].inQueue}: {containerQueue.length}
              </span>
           </div>

           {/* Fixed Slot Layout */}
           <div className={`${isSmallScreen ? 'grid grid-cols-1 gap-3 px-3 py-4' : 'flex items-end justify-center gap-4 overflow-x-auto p-4 min-h-[200px]'}`}>
             {containerSlots.map((container, index) => {
               if (container) {
                 return (
                    <ContainerBox 
                      key={container.id}
                      ref={(el) => { if(el) containerRefs.current.set(container.id, el); }}
                      container={container}
                      hoverTarget={hoverTarget?.containerId === container.id ? hoverTarget : null}
                      draggedItem={draggedItem}
                      onPack={handlePackContainer}
                      translations={translations[lang]}
                      cellSize={containerCellSize}
                      isCompact={isSmallScreen}
                    />
                 );
               } else {
                 const isQueueEmpty = containerQueue.length === 0;
                 return (
                   <button 
                     key={`slot-${index}`}
                     onClick={() => !isQueueEmpty && handleAddContainer(index)}
                     disabled={isQueueEmpty}
                     className={`
                       flex-shrink-0 w-24 h-48 border-4 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all 
                       ${isQueueEmpty 
                          ? 'border-stone-200 text-stone-300 bg-stone-50 cursor-not-allowed' 
                          : 'border-stone-300 text-stone-400 hover:text-stone-500 hover:border-stone-400 hover:bg-white/60 active:scale-95'
                       }
                     `}
                   >
                     {isQueueEmpty ? (
                        <>
                          <span className="text-4xl font-light opacity-50">∅</span>
                          <span className="text-xs font-bold">{translations[lang].noBox || "Empty"}</span>
                        </>
                     ) : (
                        <>
                          <span className="text-4xl font-light">+</span>
                          <span className="text-xs font-bold">{translations[lang].addBox}</span>
                        </>
                     )}
                   </button>
                 );
               }
             })}
           </div>
      </div>

      {/* Dragged Item Portal / Overlay */}
      {draggedItem && (
        <>
          <div 
            className="fixed pointer-events-none z-[100] opacity-90"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              transform: 'translate(-50%, -50%) scale(1.1)', 
            }}
          >
            <div 
              className="relative"
              style={{
                 display: 'grid',
                 gridTemplateColumns: `repeat(${draggedItem.shape[0].length}, ${containerCellSize}px)`, 
                 gap: '0px',
                 filter: 'drop-shadow(0 0 1px white) drop-shadow(0 0 4px rgba(255, 255, 255, 1))'
              }}
            >
              {draggedItem.shape.map((row, r) => (
                row.map((cell, c) => {
                  if (cell === 0) return <div key={`${r}-${c}`} style={{width: containerCellSize, height: containerCellSize}} />;
                  return (
                    <div 
                      key={`${r}-${c}`}
                      className={`
                        rounded-sm shadow-xl ${draggedItem.colorClass} 
                        border border-black/5
                      `}
                      style={{ width: containerCellSize, height: containerCellSize }}
                    >
                       <div className="w-full h-full border-t border-l border-white/30 rounded-sm"></div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {isSmallScreen && (
            <button
              type="button"
              onClick={rotateDraggedItem}
              onTouchStart={(e) => { e.preventDefault(); rotateDraggedItem(); }}
              className="fixed bottom-4 right-4 z-[110] bg-stone-900 text-white px-4 py-3 rounded-full shadow-2xl active:scale-95"
            >
              🔄 {translations[lang].rotateHint || '旋转'}
            </button>
          )}
        </>
      )}

    </div>
  );
}