import React, { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Info, Volume2, VolumeX, ArrowRight, RotateCcw } from 'lucide-react';
import { useGameEngine } from './GameContext';
import { StageProps } from '../types';

interface GameLayoutProps extends StageProps {
  children: ReactNode;
  onDropToFloor?: () => void;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children, onBack, onComplete, onDropToFloor }) => {
  const {
    gameState, setGameState,
    inventory, activeItem, setActiveItem,
    dialog, time, metadata,
    isMuted, setIsMuted, showHint, setShowHint,
    triggerSound, resetGame, failTitle
  } = useGameEngine();

  // Trigger completion
  useEffect(() => {
    if (gameState === 'success') {
      onComplete(metadata.id);
    }
  }, [gameState, metadata.id, onComplete]);

  return (
    <div className="w-full max-w-[400px] flex flex-col items-center gap-2 sm:gap-4 z-10">
      <header className="w-full bg-white p-3 sm:p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-xs sm:text-sm font-black tracking-tight uppercase italic leading-none w-2/3">{metadata.title}</h1>
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

      <main className="relative w-full aspect-[3/4] bg-sky-100 rounded-3xl border-8 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${metadata.backgroundImage})` }} />
        <div className="absolute bottom-0 w-full h-1/4 bg-stone-300 border-t-4 border-black" onMouseUp={onDropToFloor} />

        {children}

        <AnimatePresence>
          {gameState === 'intro' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 text-center">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-6 rounded-3xl border-8 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-[280px]">
                <h2 className="text-xl font-black mb-3 italic uppercase">{metadata.title}</h2>
                <p className="text-[10px] font-bold mb-5 text-gray-600">{metadata.description}</p>
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

          {gameState === 'fail' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`absolute inset-0 ${failTitle === 'SLEEPY...' ? 'bg-[#3b82f6]' : 'bg-[#ef4444]'} z-50 flex flex-col items-center justify-center p-6 text-center`}>
              <h2 className="text-4xl font-black text-white mb-3 italic uppercase drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">{failTitle}</h2>
              <p className="text-sm font-bold text-white mb-8">{dialog}</p>
              <button onClick={resetGame} className="bg-[#cccccc] text-black text-lg font-black px-8 py-3 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                RETRY <RotateCcw className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full pb-2">
        <div className="bg-white border-4 border-black rounded-2xl p-2 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 relative">
          <div className="w-full min-h-[3.5rem] bg-amber-50 border-2 border-black rounded-xl p-2 flex items-center justify-center text-center shadow-inner">
            <p className="text-xs sm:text-sm font-bold text-gray-800 break-words">
              {dialog || "..."}
            </p>
          </div>

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
