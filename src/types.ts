import React from 'react';

export type Item = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
};

export type GameState = 'intro' | 'playing' | 'success' | 'fail';

export type StageMetadata = {
  id: number;
  title: string;
  description: string;
  initialTime?: string;
  initialDialog?: string;
  backgroundImage?: string;
};

export type StageProps = {
  onBack: () => void;
  onComplete: (id: number) => void;
};

export type StageConfig = {
  metadata: StageMetadata;
  Component: React.FC<StageProps>;
};
