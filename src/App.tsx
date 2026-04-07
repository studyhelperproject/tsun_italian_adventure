/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, 
  Clock, 
  Menu as MenuIcon, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Hand,
  Info,
  Volume2,
  VolumeX
} from 'lucide-react';

// --- Types ---
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

type Item = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
};

type GameState = 'intro' | 'playing' | 'success' | 'fail';

const TSUN_ASSETS = {
  FAIL: 'input_file_0.png',
  SUCCESS: 'input_file_0.png',
  IDLE: 'input_file_0.png',
  SURPRISED: 'input_file_0.png',
  SLEEPING: 'input_file_0.png'
};

const ITEMS: Record<string, Item> = {
  espresso: {
    id: 'espresso',
    name: 'エスプレッソ',
    icon: <Coffee className="w-8 h-8 text-amber-900" />,
    description: 'イタリアの定番。午後に飲むならこれ。'
  },
  clock_hand: {
    id: 'clock_hand',
    name: '時計の針',
    icon: <Clock className="w-8 h-8 text-gray-700" />,
    description: '時間を操れるかもしれない。'
  },
  menu_espresso: {
    id: 'menu_espresso',
    name: 'エスプレッソメニュー',
    icon: <MenuIcon className="w-8 h-8 text-blue-600" />,
    description: 'カプチーノが載っていないメニュー。'
  }
};

// --- Audio Helper ---
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
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'use':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'success':
        [523.25, 659.25, 783.99].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(f, now + i * 0.1);
          g.gain.setValueAtTime(0.1, now + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
          o.start(now + i * 0.1);
          o.stop(now + i * 0.1 + 0.3);
        });
        break;
      case 'fail':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
    }
  } catch (e) {
    console.warn("Audio not supported or blocked", e);
  }
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [dialog, setDialog] = useState<string | null>("つん：『午後2時か...。よし、カプチーノを注文しよう！』");
  const [time, setTime] = useState("14:00");
  const [foundItems, setFoundItems] = useState<string[]>([]);
  const [isMenuSwapped, setIsMenuSwapped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSurprised, setIsSurprised] = useState(false);

  const gameRef = useRef<HTMLDivElement>(null);

  const triggerSound = useCallback((type: Parameters<typeof playSound>[0]) => {
    if (!isMuted) playSound(type);
  }, [isMuted]);

  useEffect(() => {
    if (gameState === 'playing' && !isMenuSwapped && time === "14:00") {
      const timer = setTimeout(() => {
        setGameState('fail');
        triggerSound('fail');
        setDialog("店員：『午後2時にカプチーノ！？ マジかよ...（イタリア人の視線が痛い）』");
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [gameState, isMenuSwapped, time, triggerSound]);

  const addToInventory = (itemId: string) => {
    if (foundItems.includes(itemId)) return;
    triggerSound('collect');
    setInventory([...inventory, ITEMS[itemId]]);
    setFoundItems([...foundItems, itemId]);
    setDialog(`${ITEMS[itemId].name}を手に入れた！`);
  };

  const handleDrop = (target: string) => {
    if (!activeItem) return;

    if (target === 'opa' && activeItem.id === 'menu_espresso') {
      triggerSound('success');
      setIsSurprised(true);
      setTimeout(() => {
        setIsSurprised(false);
        setIsMenuSwapped(true);
        setGameState('success');
        setDialog("つん：『お、エスプレッソしかないのか。じゃあエスプレッソで！』\n店員：『分かってるね！』");
      }, 1000);
      setActiveItem(null);
      setInventory(inventory.filter(i => i.id !== activeItem.id));
    } else if (target === 'clock' && activeItem.id === 'clock_hand') {
      triggerSound('success');
      setIsSurprised(true);
      setTimeout(() => {
        setIsSurprised(false);
        setTime("10:00");
        setDialog("時間を午前10時に戻した！これならカプチーノもOKだ。");
        setGameState('success');
      }, 1000);
      setActiveItem(null);
      setInventory(inventory.filter(i => i.id !== activeItem.id));
    } else {
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
    setIsMenuSwapped(false);
    setTime("14:00");
    setDialog("つん：『午後2時か...。よし、カプチーノを注文しよう！』");
  };

  return (
    <div className="min-h-screen bg-[#fdfcf0] font-sans text-gray-900 flex flex-col items-center justify-start p-2 sm:p-4 overflow-x-hidden relative">
      {/* Desktop Margins Illustrations */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[calc(50%-200px)] bg-[url('https://picsum.photos/seed/italy-left/400/800')] bg-cover bg-center opacity-10 border-r-4 border-black" />
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[calc(50%-200px)] bg-[url('https://picsum.photos/seed/italy-right/400/800')] bg-cover bg-center opacity-10 border-l-4 border-black" />

      {/* Fixed Width Container for Mobile Feel */}
      <div className="w-full max-w-[400px] flex flex-col items-center gap-2 sm:gap-4 z-10">
        
        {/* Header */}
        <header className="w-full bg-white p-3 sm:p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-xs sm:text-sm font-black tracking-tight uppercase italic leading-none w-2/3">Stage 01: Tsun's Italian Adventure</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => { triggerSound('click'); setIsMuted(!isMuted); }}
                className="p-1 bg-white border-2 border-black rounded-full hover:bg-gray-100 transition-colors"
              >
                {isMuted ? <VolumeX className="w-3 h-3 sm:w-4 sm:h-4" /> : <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />}
              </button>
              <button 
                onClick={() => { triggerSound('click'); setShowHint(!showHint); }}
                className="p-1 bg-amber-200 border-2 border-black rounded-full hover:bg-amber-300 transition-colors"
                title="ヒント"
              >
                <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold bg-black text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{time}</span>
            </div>
            <div className="text-[8px] sm:text-[9px] font-black uppercase text-gray-400 tracking-widest">Time Limit: 15s</div>
          </div>
        </header>

        {/* Main Game Area */}
        <main 
          ref={gameRef}
          className="relative w-full aspect-[3/4] max-h-[55vh] sm:max-h-none bg-sky-100 rounded-3xl border-8 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden cursor-default"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/italy/800/600')] bg-cover bg-center opacity-40" />
          
          {/* Italian Street Elements */}
          <div className="absolute bottom-0 w-full h-1/4 bg-stone-300 border-t-4 border-black" /> 
          
          {/* Cafe Table & Tsun */}
          <div 
            className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-full h-1/2 flex flex-col items-center justify-end"
            onMouseUp={() => handleDrop('opa')}
          >
            {/* Tsun Character */}
            <motion.div 
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="relative w-48 h-64 sm:w-56 sm:h-72 flex flex-col items-center justify-end z-10"
            >
              <div className="w-full h-full flex items-center justify-center bg-amber-50/50 rounded-2xl border-2 border-dashed border-black/20 overflow-hidden">
                <img 
                  src={
                    gameState === 'success' ? TSUN_ASSETS.SUCCESS :
                    gameState === 'fail' ? TSUN_ASSETS.FAIL :
                    isSurprised ? TSUN_ASSETS.SURPRISED :
                    TSUN_ASSETS.IDLE
                  } 
                  alt="Tsun" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center justify-center text-center p-2">
                          <div class="w-12 h-12 bg-amber-400 rounded-full border-4 border-black mb-2 animate-bounce"></div>
                          <span class="text-[10px] font-black text-black uppercase">Tsun</span>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
              
              {/* Speech Bubble */}
              {dialog && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-16 left-1/2 -translate-x-1/2 w-36 bg-white border-4 border-black p-2 rounded-2xl text-[9px] font-bold text-center shadow-lg z-20"
                >
                  {dialog}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-4 border-b-4 border-black rotate-45" />
                </motion.div>
              )}
            </motion.div>

            {/* Table */}
            <div className="w-40 h-5 sm:w-48 sm:h-6 bg-amber-800 border-4 border-black rounded-full -mt-3 z-20" />
            <div className="w-5 h-12 sm:w-6 sm:h-16 bg-amber-900 border-4 border-black z-10" />
          </div>

          {/* Interactive Objects */}
          {!foundItems.includes('menu_espresso') && (
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              onClick={() => addToInventory('menu_espresso')}
              className="absolute bottom-[5%] left-[5%] w-14 h-18 bg-green-600 border-4 border-black rounded-t-2xl cursor-pointer z-30 flex flex-col items-center justify-center"
            >
              <div className="w-6 h-6 bg-red-500 border-4 border-black rounded-full mb-1" />
              <div className="text-[7px] font-black text-white uppercase leading-none text-center">MENU</div>
            </motion.div>
          )}

          <div 
            className="absolute top-[5%] right-[5%] w-16 h-16 sm:w-20 sm:h-20 bg-white border-4 border-black rounded-full flex items-center justify-center shadow-lg cursor-pointer"
            onMouseUp={() => handleDrop('clock')}
          >
            <div className="relative w-full h-full">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-black rounded-full z-10" />
              {/* Hour Hand */}
              <div 
                className="absolute top-1/2 left-1/2 w-1 h-5 sm:w-1.5 sm:h-6 bg-black rounded-full" 
                style={{ 
                  transformOrigin: '50% 100%',
                  transform: `translate(-50%, -100%) rotate(${time === "14:00" ? 60 : 0}deg)` 
                }}
              />
              {/* Minute Hand */}
              <div 
                className="absolute top-1/2 left-1/2 w-0.5 h-7 sm:w-1 sm:h-8 bg-black rounded-full" 
                style={{ 
                  transformOrigin: '50% 100%',
                  transform: `translate(-50%, -100%) rotate(${time === "14:00" ? 0 : 300}deg)` 
                }}
              />
            </div>
          </div>

          {!foundItems.includes('clock_hand') && (
            <motion.div 
              whileHover={{ scale: 1.1, rotate: -5 }}
              onClick={() => addToInventory('clock_hand')}
              className="absolute bottom-[5%] right-[10%] w-10 h-14 bg-gray-400 border-4 border-black rounded-b-lg cursor-pointer z-30 flex flex-col items-center"
            >
              <div className="w-full h-2 bg-gray-500 border-4 border-black rounded-full -mt-2" />
              <div className="mt-3 w-0.5 h-5 bg-black/20 rounded-full" />
            </motion.div>
          )}

          {/* Overlays */}
          <AnimatePresence>
            {gameState === 'intro' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 text-center"
              >
                <motion.div 
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  className="bg-white p-5 rounded-3xl border-8 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] w-full max-w-[300px]"
                >
                  <div className="relative w-28 h-28 mx-auto mb-3 bg-amber-100 rounded-full border-4 border-black overflow-hidden flex items-center justify-center">
                    <img src={TSUN_ASSETS.IDLE} alt="Tsun Intro" className="relative w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="absolute text-[10px] font-black text-black/20 uppercase">Tsun</span>
                  </div>
                  <h2 className="text-xl font-black mb-3 italic uppercase leading-none">Tsun's Italian Adventure</h2>
                  <p className="text-[10px] font-bold mb-5 text-gray-600 leading-relaxed">
                    常識知らずの中学1年生「つん」がイタリアへ！<br/>
                    午後2時にカプチーノを頼もうとする彼女を<br/>
                    なんとかして止めよう！
                  </p>
                  
                  <button 
                    onClick={() => { triggerSound('click'); setGameState('playing'); }}
                    className="w-full bg-black text-white text-lg font-black py-3 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                  >
                    START <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {gameState === 'success' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[#22c55e] z-50 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 mb-4 bg-white rounded-full border-8 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center">
                  <img src={TSUN_ASSETS.SUCCESS} alt="Success" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <span className="absolute text-xl font-black text-black/20 uppercase">Success</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 italic uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">EXCELLENT!</h2>
                <p className="text-sm sm:text-base font-bold text-white mb-8 leading-tight">
                  つんは無事にイタリアの洗礼を回避した！
                </p>
                <button 
                  onClick={resetGame}
                  className="bg-[#cccccc] text-black text-lg sm:text-xl font-black px-8 py-3 sm:px-12 sm:py-4 rounded-full border-4 border-black hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  PLAY AGAIN <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </motion.div>
            )}

            {gameState === 'fail' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-[#ef4444] z-50 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 mb-4 bg-white rounded-full border-8 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center">
                  <img src={TSUN_ASSETS.FAIL} alt="Fail" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <span className="absolute text-xl font-black text-black/20 uppercase">Fail</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 italic uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">MAMMA MIA!</h2>
                <p className="text-sm sm:text-base font-bold text-white mb-8 leading-tight">
                  つんはイタリア人の冷たい視線に耐えられなかった...
                </p>
                <button 
                  onClick={resetGame}
                  className="bg-[#cccccc] text-black text-lg sm:text-xl font-black px-8 py-3 sm:px-12 sm:py-4 rounded-full border-4 border-black hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  RETRY <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Inventory Bar */}
        <footer className="w-full pb-2">
          <div className="bg-white border-4 border-black rounded-2xl p-2 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-1 sm:gap-3 relative">
            <div className="absolute -top-3.5 left-4 bg-black text-white px-3 py-1 rounded-md font-black text-[9px] uppercase flex items-center gap-1 border-2 border-black">
              <Hand className="w-3 h-3" /> ITEM SLOT
            </div>
            
            <div className="flex justify-end h-3">
              {activeItem && (
                <div className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[7px] sm:text-[9px] font-black uppercase flex items-center gap-1">
                  <Info className="w-2 h-2 sm:w-3 h-3" /> {activeItem.name}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full pb-1 pt-1 scrollbar-hide px-1 justify-center">
              {[0, 1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-4 border-black flex items-center justify-center transition-all ${
                    inventory[i] 
                      ? 'bg-amber-100 cursor-pointer active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-gray-50 border-dashed opacity-40'
                  } ${activeItem?.id === inventory[i]?.id ? 'ring-4 ring-blue-500 bg-blue-50 scale-105' : ''}`}
                  onClick={() => {
                    if (inventory[i]) {
                      triggerSound('click');
                      setActiveItem(inventory[i]);
                    }
                  }}
                >
                  {inventory[i]?.icon && React.cloneElement(inventory[i].icon as React.ReactElement, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
                </div>
              ))}
            </div>

            {activeItem && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-50 border-2 border-blue-200 p-2 rounded-xl text-[9px] sm:text-[10px] text-blue-600 font-bold leading-tight"
              >
                {activeItem.description}
              </motion.div>
            )}
          </div>
        </footer>

        {/* Instructions */}
        <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-4">
          Tap items to collect • Tap slot to select • Tap target to use
        </p>
      </div>
    </div>
  );
}
