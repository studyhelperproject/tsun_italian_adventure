import React, { useState, useEffect } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { StageSelect } from './components/StageSelect';
import { GameStage } from './components/GameStage';
import { allStages } from './stages';
import { StageConfig } from './types';

export default function App() {
  const [view, setView] = useState<'title' | 'map' | 'playing'>('title');
  const [currentStage, setCurrentStage] = useState<StageConfig | null>(null);
  const [clearedStages, setClearedStages] = useState<number[]>([]);

  // Load progress
  useEffect(() => {
    const saved = localStorage.getItem('tsun_adventure_progress');
    if (saved) {
      try {
        setClearedStages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, []);

  const handleStageSelect = (stage: StageConfig) => {
    setCurrentStage(stage);
    setView('playing');
  };

  const handleStageComplete = (id: number) => {
    if (!clearedStages.includes(id)) {
      const newCleared = [...clearedStages, id];
      setClearedStages(newCleared);
      localStorage.setItem('tsun_adventure_progress', JSON.stringify(newCleared));
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf0] font-sans text-gray-900 flex flex-col items-center justify-start p-2 sm:p-4 overflow-x-hidden relative">
      {/* Desktop Margins Illustrations */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[calc(50%-250px)] bg-[url('https://picsum.photos/seed/italy-left/400/800')] bg-cover bg-center opacity-10 border-r-4 border-black" />
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[calc(50%-250px)] bg-[url('https://picsum.photos/seed/italy-right/400/800')] bg-cover bg-center opacity-10 border-l-4 border-black" />

      {view === 'title' && (
        <TitleScreen onStart={() => setView('map')} />
      )}

      {view === 'map' && (
        <StageSelect 
          stages={allStages} 
          clearedStages={clearedStages} 
          onSelect={handleStageSelect}
          onBack={() => setView('title')}
        />
      )}

      {view === 'playing' && currentStage && (
        <GameStage 
          config={currentStage} 
          onBack={() => setView('map')}
          onComplete={handleStageComplete}
        />
      )}
    </div>
  );
}
