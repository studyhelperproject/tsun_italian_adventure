import React from 'react';
import { motion } from 'motion/react';
import { useGameEngine } from '../GameContext';
import { Item } from '../../types';

interface FloorItemProps {
  item: Item;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const FloorItem: React.FC<FloorItemProps> = ({ item, style, className, onClick }) => {
  const { addToInventory, triggerSound } = useGameEngine();
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      onClick={() => {
        if (onClick) {
          triggerSound('collect');
          onClick();
        } else {
          addToInventory(item);
        }
      }}
      style={style}
      className={`absolute cursor-pointer flex items-center justify-center z-20 ${className || 'w-10 h-12 bg-white border-2 border-black rounded shadow-md'}`}
    >
      {item.icon}
    </motion.div>
  );
};
