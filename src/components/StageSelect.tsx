import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import { StageConfig } from '../types';

interface StageSelectProps {
  stages: StageConfig[];
  clearedStages: number[];
  onSelect: (stage: StageConfig) => void;
  onBack: () => void;
}

export const StageSelect: React.FC<StageSelectProps> = ({ stages, clearedStages, onSelect, onBack }) => {
  return (
    <div className="w-full max-w-[500px] p-4">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 bg-white border-4 border-black rounded-xl hover:bg-gray-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Select Stage</h2>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const id = stage.metadata.id;
          const isCleared = clearedStages.includes(id);
          const isLocked = id > 1 && !clearedStages.includes(id - 1);
          
          return (
            <motion.button
              key={id}
              whileHover={!isLocked ? { scale: 1.05, rotate: 2 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              onClick={() => !isLocked && onSelect(stage)}
              disabled={isLocked}
              className={`
                aspect-square rounded-2xl border-4 border-black flex flex-col items-center justify-center relative transition-all
                ${isLocked ? 'bg-gray-200 opacity-50 cursor-not-allowed' : 'bg-white cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
                ${isCleared ? 'bg-green-50 border-green-600' : ''}
              `}
            >
              <span className={`text-xl font-black ${isCleared ? 'text-green-600' : 'text-black'}`}>
                {id}
              </span>
              
              {isCleared && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-0.5 border-2 border-black">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              )}
              
              {isLocked && (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
            </motion.button>
          );
        })}
      </div>
      
      <div className="mt-12 p-6 bg-amber-50 border-4 border-black rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-black uppercase text-sm mb-2">Progress</h3>
        <div className="w-full h-4 bg-white border-2 border-black rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(clearedStages.length / stages.length) * 100}%` }}
            className="h-full bg-green-500"
          />
        </div>
        <p className="text-[10px] font-bold mt-2 text-right">
          {clearedStages.length} / {stages.length} STAGES CLEARED
        </p>
      </div>
    </div>
  );
};
