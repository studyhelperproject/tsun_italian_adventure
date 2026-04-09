import React from 'react';

export type Item = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
};

export type GameState = 'intro' | 'playing' | 'success' | 'fail' | 'sleeping' | 'espresso_fail';

export type StageConfig = {
  id: number;
  title: string;
  description: string;
  initialTime: string;
  initialDialog: string;
  backgroundImage: string;
  items: Record<string, Item>;
  menuPositions: Record<string, { bottom: string, left: string, rotate: string }>;
  floorItemIds: string[];
  clockHandId?: string;
  onDrop: (
    target: string, 
    activeItem: Item, 
    state: { 
      time: string, 
      setTime: (t: string) => void,
      setDialog: (d: string) => void,
      setGameState: (s: GameState) => void,
      triggerSound: (s: string) => void,
      setIsSurprised: (b: boolean) => void,
      inventory: Item[],
      setInventory: (i: Item[]) => void,
      setActiveItem: (i: Item | null) => void,
      setIsReadingMenu: (b: boolean) => void,
      setWaiterState: (s: string) => void,
      setServedItem: (s: string | null) => void,
    }
  ) => boolean; // returns true if handled
};
