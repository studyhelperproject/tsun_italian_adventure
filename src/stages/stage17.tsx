import React from 'react';
import { StageMetadata, StageProps } from '../types';
import { GameLayout } from '../engine/GameLayout';
import { useGameEngine } from '../engine/GameContext';

export const metadata: StageMetadata = {
  id: 17,
  title: "Stage 17",
  description: "Coming soon...",
  initialTime: "12:00",
  initialDialog: "つん：『ここはどこだろう？』",
  backgroundImage: "https://picsum.photos/seed/stage17/800/600",
};

export const Component: React.FC<StageProps> = ({ onBack, onComplete }) => {
  const { setGameState, setDialog, triggerSound } = useGameEngine();

  return (
    <GameLayout onBack={onBack} onComplete={onComplete}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <h2 className="text-4xl font-black text-black/20 italic transform -rotate-12">STAGE 17</h2>
      </div>
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 cursor-pointer" onMouseUp={() => { triggerSound('success'); setGameState('success'); setDialog('クリア！'); }}>
        <button className="bg-amber-500 text-white font-bold py-2 px-4 rounded shadow-lg transition hover:scale-105 active:scale-95 z-40 relative pointer-events-auto">Click to win!</button>
      </div>
    </GameLayout>
  );
};
