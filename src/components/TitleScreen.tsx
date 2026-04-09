import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Coffee } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <div className="relative inline-block">
          <Coffee className="w-24 h-24 sm:w-32 sm:h-32 text-amber-900" />
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-4 -right-4 text-4xl"
          >
            🇮🇹
          </motion.div>
        </div>
      </motion.div>
      
      <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter mb-4 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] text-amber-900">
        TSUN'S<br/>ITALIAN<br/>ADVENTURE
      </h1>
      
      <p className="text-sm sm:text-base font-bold text-gray-600 mb-12 max-w-[280px]">
        常識知らずの中学生「つん」と一緒に、イタリアの食習慣をマスターしよう！
      </p>
      
      <button 
        onClick={onStart}
        className="bg-black text-white text-xl font-black px-12 py-4 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]"
      >
        START GAME <ArrowRight className="w-6 h-6" />
      </button>
    </div>
  );
};
