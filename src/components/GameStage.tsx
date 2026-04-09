import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Hand,
  Info,
  Volume2,
  VolumeX,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { StageConfig, Item, GameState } from '../types';

const TSUN_ASSETS = {
  FAIL: 'https://raw.githubusercontent.com/studyhelperproject/tsun_italian_adventure/main/tsun_crying.png',
  SUCCESS: 'https://raw.githubusercontent.com/studyhelperproject/tsun_italian_adventure/main/tsun_drinking.png',
  IDLE: 'https://raw.githubusercontent.com/studyhelperproject/tsun_italian_adventure/main/tsun_standing.png',
  SURPRISED: 'https://raw.githubusercontent.com/studyhelperproject/tsun_italian_adventure/main/tsun_shocked.png',
  SLEEPING: 'https://raw.githubusercontent.com/studyhelperproject/tsun_italian_adventure/main/tsun_sleeping.png',
  MENU: 'https://raw.githubusercontent.com/studyhelperproject/tsun_italian_adventure/main/tsun_menu.png'
};

const GAME_ASSETS = {
  CAPPUCCINO: 'https://github.com/studyhelperproject/tsun_italian_adventure/blob/main/Cappuccino.png?raw=true',
  ESPRESSO: 'https://github.com/studyhelperproject/tsun_italian_adventure/blob/main/Espresso.png?raw=true',
  PASTA: 'https://github.com/studyhelperproject/tsun_italian_adventure/blob/main/Pasta.png?raw=true',
  WINE: 'https://github.com/studyhelperproject/tsun_italian_adventure/blob/main/Wine.png?raw=true',
  STAFF: 'https://github.com/studyhelperproject/tsun_italian_adventure/blob/main/CafeStaff.png?raw=true'
};

const playSound = (type: 'collect' | 'use' | 'success' | 'fail' | 'click') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    switch(type) {
      case 'collect':
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'use':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
        break;
      case 'success':
        [523.25, 659.25, 783.99].forEach((f, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.setValueAtTime(f, now + i * 0.1);
          g.gain.setValueAtTime(0.1, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.3);
        });
        break;
      case 'fail':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
        break;
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
        break;
    }
  } catch (e) { console.warn("Audio not supported", e); }
};

interface GameStageProps {
  config: StageConfig;
  onBack: () => void;
  onComplete: (id: number) => void;
}

export const GameStage: React.FC<GameStageProps> = ({ config, onBack, onComplete }) => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [dialog, setDialog] = useState<string | null>(config.initialDialog);
  const [time, setTime] = useState(config.initialTime);
  const [foundItems, setFoundItems] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSurprised, setIsSurprised] = useState(false);
  const [isReadingMenu, setIsReadingMenu] = useState(false);
  const [waiterState, setWaiterState] = useState<'idle' | 'entering' | 'serving' | 'leaving'>('idle');
  const [servedItem, setServedItem] = useState<string | null>(null);

  const gameRef = useRef<HTMLDivElement>(null);

  const triggerSound = useCallback((type: Parameters<typeof playSound>[0]) => {
    if (!isMuted) playSound(type);
  }, [isMuted]);

  useEffect(() => {
    if (gameState === 'playing' && time === "14:00") {
      const timer = setTimeout(() => {
        setGameState('fail');
        triggerSound('fail');
        setDialog("店員：『午後2時にカプチーノ！？ マジかよ...（イタリア人の視線が痛い）』");
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [gameState, time, triggerSound]);

  const addToInventory = (itemId: string) => {
    if (inventory.length >= 5) {
      setDialog("つん：『もう持てないよ！』");
      return;
    }
    triggerSound('collect');
    setInventory([...inventory, config.items[itemId]]);
    setFoundItems([...foundItems, itemId]);
    setDialog(`${config.items[itemId].name}を手に入れた！`);
  };

  const handleDrop = (target: string) => {
    if (!activeItem) return;

    if (target === 'floor') {
      const menuIds = ['espresso_menu', 'cappuccino_menu', 'pasta_menu', 'wine_menu'];
      if (menuIds.includes(activeItem.id)) {
        triggerSound('click');
        setInventory(inventory.filter(i => i.id !== activeItem.id));
        setFoundItems(foundItems.filter(id => id !== activeItem.id));
        setDialog(`${activeItem.name}を床に戻した。`);
        setActiveItem(null);
        return;
      }
    }

    const handled = config.onDrop(target, activeItem, {
      time, setTime, setDialog, setGameState, triggerSound, setIsSurprised,
      inventory, setInventory, setActiveItem, setIsReadingMenu, setWaiterState, setServedItem
    });

    if (!handled) {
      triggerSound('click');
      setDialog("ここでは使えないようだ...");
      setActiveItem(null);
    }
  };

  const resetGame = () => {
    triggerSound('click');
    setGameState('playing');
    setInventory([]);
    setActiveItem(null);
    setFoundItems([]);
    setTime(config.initialTime);
    setDialog(config.initialDialog);
    setIsReadingMenu(false);
    setWaiterState('idle');
    setServedItem(null);
  };

  useEffect(() => {
    if (gameState === 'success') {
      onComplete(config.id);
    }
  }, [gameState, config.id, onComplete]);

  return (
    <div className="w-full max-w-[400px] flex flex-col items-center gap-2 sm:gap-4 z-10">
      <header className="w-full bg-white p-3 sm:p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-xs sm:text-sm font-black tracking-tight uppercase italic leading-none w-2/3">{config.title}</h1>
          <div className="flex gap-2">
            <button onClick={() => { triggerSound('click'); setIsMuted(!isMuted); }} className="p-1 bg-white border-2 border-black rounded-full">
              {isMuted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
            <button onClick={() => { triggerSound('click'); setShowHint(!showHint); }} className="p-1 bg-amber-200 border-2 border-black rounded-full">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button onClick={() => { triggerSound('click'); onBack(); }} className="p-1 bg-gray-200 border-2 border-black rounded-full">
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold bg-black text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{time}</span>
          </div>
        </div>
      </header>

      <main ref={gameRef} className="relative w-full aspect-[3/4] bg-sky-100 rounded-3xl border-8 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${config.backgroundImage})` }} />
        <div className="absolute bottom-0 w-full h-1/4 bg-stone-300 border-t-4 border-black" onMouseUp={() => handleDrop('floor')} /> 
        
        {config.floorItemIds.map((id) => (
          !foundItems.includes(id) && (
            <motion.div
              key={id}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={() => addToInventory(id)}
              style={{ 
                bottom: config.menuPositions[id].bottom, 
                left: config.menuPositions[id].left,
                rotate: config.menuPositions[id].rotate
              }}
              className="absolute w-10 h-12 bg-white border-2 border-black rounded shadow-md cursor-pointer flex items-center justify-center z-20"
            >
              {config.items[id].icon}
            </motion.div>
          )
        ))}

        <AnimatePresence>
          {waiterState !== 'idle' && (
            <motion.div initial={{ x: '100%' }} animate={{ x: waiterState === 'entering' || waiterState === 'serving' ? '20%' : '100%' }} className="absolute top-1/4 right-0 w-1/2 h-1/2 z-30 pointer-events-none">
              <img src={GAME_ASSETS.STAFF} alt="Waiter" className="w-full h-full object-contain" />
              {waiterState === 'serving' && servedItem && (
                <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} className="absolute top-1/2 -left-10 w-16 h-16 bg-white border-4 border-black rounded-full p-2 shadow-lg">
                  <img src={GAME_ASSETS[servedItem.toUpperCase() as keyof typeof GAME_ASSETS]} alt={servedItem} className="w-full h-full object-contain" />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 z-10" onMouseUp={() => handleDrop('clock')}>
          <div className="relative w-full h-full bg-white rounded-full border-4 border-black shadow-inner flex items-center justify-center">
            <div className="absolute top-1/2 left-1/2 w-1 h-4 bg-black rounded-full" style={{ transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${time === "14:00" ? 60 : 300}deg)` }} />
            <div className="absolute top-1/2 left-1/2 w-0.5 h-7 bg-black rounded-full" style={{ transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${time === "14:00" ? 0 : 300}deg)` }} />
          </div>
        </div>

        {config.clockHandId && !foundItems.includes(config.clockHandId) && (
          <motion.div onClick={() => addToInventory(config.clockHandId!)} className="absolute bottom-[20%] right-[10%] w-10 h-14 bg-gray-400 border-4 border-black rounded-b-lg cursor-pointer z-30 flex flex-col items-center">
            <div className="w-full h-2 bg-gray-500 border-4 border-black rounded-full -mt-2" />
            <div className="mt-3 w-0.5 h-5 bg-black/20 rounded-full" />
          </motion.div>
        )}

        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-full h-1/2 flex flex-col items-center justify-end" onMouseUp={() => handleDrop('tsun')}>
          <motion.div animate={isSurprised ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}} className="relative w-32 h-48 sm:w-40 sm:h-56">
            <img src={gameState === 'success' ? TSUN_ASSETS.SUCCESS : gameState === 'fail' ? TSUN_ASSETS.FAIL : gameState === 'sleeping' ? TSUN_ASSETS.SLEEPING : gameState === 'espresso_fail' ? TSUN_ASSETS.FAIL : isReadingMenu ? TSUN_ASSETS.MENU : isSurprised ? TSUN_ASSETS.SURPRISED : TSUN_ASSETS.IDLE} className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
          </motion.div>
        </div>

        <AnimatePresence>
          {gameState === 'intro' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 text-center">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-6 rounded-3xl border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-[280px]">
                <h2 className="text-xl font-black mb-3 italic uppercase">{config.title}</h2>
                <p className="text-[10px] font-bold mb-5 text-gray-600">{config.description}</p>
                <button onClick={() => { triggerSound('click'); setGameState('playing'); }} className="w-full bg-black text-white text-lg font-black py-3 rounded-full flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                  START <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {gameState === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-[#22c55e] z-50 flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-4xl font-black text-white mb-3 italic uppercase drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">EXCELLENT!</h2>
              <button onClick={onBack} className="bg-[#cccccc] text-black text-lg font-black px-8 py-3 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                MAP <RotateCcw className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {(gameState === 'fail' || gameState === 'sleeping' || gameState === 'espresso_fail') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`absolute inset-0 ${gameState === 'sleeping' ? 'bg-[#3b82f6]' : 'bg-[#ef4444]'} z-50 flex flex-col items-center justify-center p-6 text-center`}>
              <h2 className="text-4xl font-black text-white mb-3 italic uppercase drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">{gameState === 'sleeping' ? 'SLEEPY...' : 'MAMMA MIA!'}</h2>
              <p className="text-sm font-bold text-white mb-8">{dialog}</p>
              <button onClick={resetGame} className="bg-[#cccccc] text-black text-lg font-black px-8 py-3 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                RETRY <RotateCcw className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full pb-2">
        <div className="bg-white border-4 border-black rounded-2xl p-2 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1 sm:gap-3 relative">
          <div className="flex gap-2 overflow-x-auto w-full pb-1 pt-1 justify-center">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-4 border-black flex items-center justify-center ${inventory[i] ? 'bg-amber-100 cursor-pointer' : 'bg-gray-50 opacity-40'} ${activeItem?.id === inventory[i]?.id ? 'ring-4 ring-blue-500 scale-105' : ''}`} onClick={() => inventory[i] && setActiveItem(inventory[i])}>
                {inventory[i]?.icon}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
