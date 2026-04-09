import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState, Item, StageMetadata } from '../types';

export const playSound = (type: 'collect' | 'use' | 'success' | 'fail' | 'click') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    switch (type) {
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

interface EngineState {
  gameState: GameState;
  setGameState: (state: GameState, title?: string) => void;
  inventory: Item[];
  setInventory: (items: Item[]) => void;
  addToInventory: (item: Item) => void;
  removeFromInventory: (itemId: string) => void;
  activeItem: Item | null;
  setActiveItem: (item: Item | null) => void;
  dialog: string | null;
  setDialog: (d: string | null) => void;
  time: string;
  setTime: (t: string) => void;
  triggerSound: (type: 'collect' | 'use' | 'success' | 'fail' | 'click') => void;
  failTitle: string;
  metadata: StageMetadata;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  showHint: boolean;
  setShowHint: (hint: boolean) => void;
  resetGame: () => void;
}

const GameContext = createContext<EngineState | undefined>(undefined);

export const GameProvider: React.FC<{ metadata: StageMetadata, children: ReactNode }> = ({ metadata, children }) => {
  const [gameState, setGameStateInner] = useState<GameState>('intro');
  const [failTitle, setFailTitle] = useState('MAMMA MIA!');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [dialog, setDialog] = useState<string | null>(metadata.initialDialog || null);
  const [time, setTime] = useState(metadata.initialTime || "12:00");
  const [isMuted, setIsMuted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const setGameState = useCallback((state: GameState, title?: string) => {
    setGameStateInner(state);
    if (title) setFailTitle(title);
  }, []);

  const triggerSound = useCallback((type: Parameters<typeof playSound>[0]) => {
    if (!isMuted) playSound(type);
  }, [isMuted]);

  const addToInventory = useCallback((item: Item) => {
    setInventory(prev => {
      if (prev.length >= 5) {
        setDialog("もう持てないよ！");
        return prev;
      }
      triggerSound('collect');
      setDialog(`${item.name}を手に入れた！`);
      return [...prev, item];
    });
  }, [triggerSound]);

  const removeFromInventory = useCallback((itemId: string) => {
    setInventory(prev => prev.filter(i => i.id !== itemId));
    setActiveItem(current => current?.id === itemId ? null : current);
  }, []);

  const resetGame = useCallback(() => {
    triggerSound('click');
    setGameStateInner('playing');
    setInventory([]);
    setActiveItem(null);
    setTime(metadata.initialTime || "12:00");
    setDialog(metadata.initialDialog || null);
    setFailTitle('MAMMA MIA!');
  }, [metadata, triggerSound]);

  return (
    <GameContext.Provider value={{
      gameState, setGameState,
      inventory, setInventory, addToInventory, removeFromInventory,
      activeItem, setActiveItem,
      dialog, setDialog,
      time, setTime,
      triggerSound,
      failTitle,
      metadata,
      isMuted, setIsMuted,
      showHint, setShowHint,
      resetGame
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameEngine = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameEngine must be used within a GameProvider');
  }
  return context;
};
