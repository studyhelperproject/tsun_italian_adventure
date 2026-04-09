import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StageMetadata, StageProps, Item } from '../types';
import { GameLayout } from '../engine/GameLayout';
import { useGameEngine } from '../engine/GameContext';
import { FloorItem } from '../engine/components/FloorItem';

// Assets
import clockHandImg from '../assets/items/ClockHand.png';
import espressoMenuImg from '../assets/items/EspressoMenu.png';
import cappuccinoMenuImg from '../assets/items/CappuccinoMenu.png';
import pastaMenuImg from '../assets/items/PastaMenu.png';
import wineMenuImg from '../assets/items/WineMenu.png';
import itemCappuccino from '../assets/items/Cappuccino.png';
import itemEspresso from '../assets/items/Espresso.png';
import itemPasta from '../assets/items/Pasta.png';
import itemWine from '../assets/items/Wine.png';
import itemStaff from '../assets/items/CafeStaff.png';

import tsunCrying from '../assets/tsun/tsun_crying.png';
import tsunDrinking from '../assets/tsun/tsun_drinking.png';
import tsunStanding from '../assets/tsun/tsun_standing.png';
import tsunShocked from '../assets/tsun/tsun_shocked.png';
import tsunSleeping from '../assets/tsun/tsun_sleeping.png';
import tsunMenu from '../assets/tsun/tsun_menu.png';

export const metadata: StageMetadata = {
  id: 1,
  title: "Stage 01: Tsun's Italian Adventure",
  description: "イタリアのマナーを守って注文しよう！",
  initialTime: "14:00",
  initialDialog: "つん：『ちょっと眠くなってきたな... かわいいものを頼もうかな』",
  backgroundImage: "https://picsum.photos/seed/italy/800/600",
};

const ITEMS: Record<string, Item> = {
  espresso_menu: {
    id: 'espresso_menu',
    name: 'エスプレッソメニュー',
    icon: <img src={espressoMenuImg} alt="Espresso Menu" className="w-full h-full object-contain drop-shadow-md" />,
    description: '本場イタリアの苦いコーヒー。'
  },
  cappuccino_menu: {
    id: 'cappuccino_menu',
    name: 'カプチーノメニュー',
    icon: <img src={cappuccinoMenuImg} alt="Cappuccino Menu" className="w-full h-full object-contain drop-shadow-md" />,
    description: '泡の載ったコーヒー'
  },
  pasta_menu: {
    id: 'pasta_menu',
    name: 'パスタメニュー',
    icon: <img src={pastaMenuImg} alt="Pasta Menu" className="w-full h-full object-contain drop-shadow-md" />,
    description: 'お腹が空いた時に。'
  },
  wine_menu: {
    id: 'wine_menu',
    name: 'ワインメニュー',
    icon: <img src={wineMenuImg} alt="Wine Menu" className="w-full h-full object-contain drop-shadow-md" />,
    description: '大人の飲み物。'
  },
  clock_hand: {
    id: 'clock_hand',
    name: '時計の短針',
    icon: <img src={clockHandImg} alt="Clock Hand" className="w-full h-full object-contain drop-shadow-md" />,
    description: '折れた時計の針。'
  }
};

const SERVED_ASSETS: Record<string, string> = {
  CAPPUCCINO: itemCappuccino,
  ESPRESSO: itemEspresso,
  PASTA: itemPasta,
  WINE: itemWine
};

export const Component: React.FC<StageProps> = ({ onBack, onComplete }) => {
  const {
    gameState, setGameState,
    inventory, activeItem, setActiveItem, removeFromInventory,
    setDialog, time, setTime,
    triggerSound, failTitle
  } = useGameEngine();

  // Stage specific state
  const [floorItems, setFloorItems] = useState(['cappuccino_menu', 'espresso_menu', 'pasta_menu', 'wine_menu']);
  const [clockHandFound, setClockHandFound] = useState(false);
  const [isSurprised, setIsSurprised] = useState(false);
  const [isReadingMenu, setIsReadingMenu] = useState(false);
  const [waiterState, setWaiterState] = useState<'idle' | 'entering' | 'serving' | 'leaving'>('idle');
  const [servedItem, setServedItem] = useState<string | null>(null);

  // Time Out Logic
  useEffect(() => {
    if (gameState === 'playing' && time === "14:00") {
      const timer = setTimeout(() => {
        triggerSound('fail');
        setDialog("店員：『注文、しないの？（イタリア人の視線が痛い）』");
        setGameState('fail', 'MAMMA MIA!');
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [gameState, time, triggerSound, setGameState, setDialog]);

  // Handle floor manual drops
  const handleDropToFloor = () => {
    if (!activeItem) return;
    const menuIds = ['espresso_menu', 'cappuccino_menu', 'pasta_menu', 'wine_menu'];
    if (menuIds.includes(activeItem.id)) {
      triggerSound('click');
      removeFromInventory(activeItem.id);
      setFloorItems(prev => [...prev, activeItem.id]);
      setDialog(`${activeItem.name}を床に戻した。`);
    } else if (activeItem.id === 'clock_hand') {
      triggerSound('click');
      removeFromInventory(activeItem.id);
      setClockHandFound(false);
      setDialog(`${activeItem.name}を落とした。`);
    } else {
      triggerSound('click');
      setDialog("ここでは使えないようだ...");
      setActiveItem(null);
    }
  };

  const handleTsunDrop = () => {
    if (!activeItem) return;
    const menuIds = ['espresso_menu', 'cappuccino_menu', 'pasta_menu', 'wine_menu'];

    if (menuIds.includes(activeItem.id)) {
      const currentItemId = activeItem.id;
      setIsReadingMenu(true);
      triggerSound('use');
      setDialog(`つん：『どれどれ... ${activeItem.name}を読んでみよう。』`);
      removeFromInventory(currentItemId);

      setTimeout(() => {
        setWaiterState('entering');
        setDialog("店員が注文を取りにやってきた！");

        setTimeout(() => {
          setWaiterState('serving');
          setServedItem(currentItemId.replace('_menu', ''));
          setIsReadingMenu(false);

          setTimeout(() => {
            setWaiterState('leaving');

            setTimeout(() => {
              setWaiterState('idle');
              if (currentItemId === 'cappuccino_menu') {
                if (time === "14:00") {
                  setDialog("つん：『うわぁぁ！午後にカプチーノを頼むなんて、イタリアではありえないんだって！笑われちゃった...』");
                  triggerSound('fail');
                  setGameState('fail', 'MAMMA MIA!');
                } else {
                  setDialog("つん：『やった！午前中のカプチーノは最高だね！イタリア人みたい！』");
                  triggerSound('success');
                  setGameState('success');
                }
              } else if (currentItemId === 'pasta_menu') {
                setDialog("つん：『お腹いっぱい... 眠くなってきちゃった... むにゃむにゃ...』");
                triggerSound('fail');
                setGameState('fail', 'SLEEPY...');
              } else if (currentItemId === 'espresso_menu') {
                setDialog("つん：『に、にがーーい！！思わず頭から被っちゃったよ！！』");
                triggerSound('fail');
                setGameState('fail', 'MAMMA MIA!');
              } else if (currentItemId === 'wine_menu') {
                setDialog("つん：『何このジュース... 眠くなってきちゃった... むにゃむにゃ...』");
                triggerSound('fail');
                setGameState('fail', 'SLEEPY...');
              }
            }, 1000);
          }, 1500);
        }, 1500);
      }, 2000);
    } else {
      triggerSound('click');
      setDialog("ここでは使えないようだ...");
      setActiveItem(null);
    }
  };

  const handleClockDrop = () => {
    if (activeItem?.id === 'clock_hand') {
      triggerSound('success');
      setIsSurprised(true);
      removeFromInventory(activeItem.id);
      setTimeout(() => {
        setIsSurprised(false);
        setTime("10:00");
        setDialog("時間を戻した！");
      }, 1000);
    } else {
      triggerSound('click');
      setDialog("ここでは使えないようだ...");
      setActiveItem(null);
    }
  };

  const getTsunAvatar = () => {
    if (gameState === 'success') return tsunDrinking;
    if (failTitle === 'SLEEPY...') return tsunSleeping;
    if (gameState === 'fail') return tsunCrying;
    if (isReadingMenu) return tsunMenu;
    if (isSurprised) return tsunShocked;
    return tsunStanding;
  };

  return (
    <GameLayout onBack={onBack} onComplete={onComplete} onDropToFloor={handleDropToFloor}>
      {/* Floor Items */}
      {floorItems.includes('cappuccino_menu') && (
        <FloorItem item={ITEMS.cappuccino_menu} style={{ bottom: '4%', left: '10%', rotate: '-10deg' }} onClick={() => { setFloorItems(p => p.filter(i => i !== 'cappuccino_menu')) }} />
      )}
      {floorItems.includes('espresso_menu') && (
        <FloorItem item={ITEMS.espresso_menu} style={{ bottom: '6%', left: '35%', rotate: '5deg' }} onClick={() => { setFloorItems(p => p.filter(i => i !== 'espresso_menu')) }} />
      )}
      {floorItems.includes('pasta_menu') && (
        <FloorItem item={ITEMS.pasta_menu} style={{ bottom: '3%', left: '60%', rotate: '-5deg' }} onClick={() => { setFloorItems(p => p.filter(i => i !== 'pasta_menu')) }} />
      )}
      {floorItems.includes('wine_menu') && (
        <FloorItem item={ITEMS.wine_menu} style={{ bottom: '7%', left: '80%', rotate: '15deg' }} onClick={() => { setFloorItems(p => p.filter(i => i !== 'wine_menu')) }} />
      )}

      {/* Clock UI (Custom for Stage 1) */}
      <div className="absolute top-[5%] right-[5%] w-24 h-24 sm:w-32 sm:h-32 z-10" onMouseUp={handleClockDrop}>
        <div className="relative w-full h-full bg-white rounded-full border-4 border-black shadow-inner flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 w-1 h-4 bg-black rounded-full" style={{ transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${time === "14:00" ? 60 : 300}deg)` }} />
          <div className="absolute top-1/2 left-1/2 w-0.5 h-7 bg-black rounded-full" style={{ transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${time === "14:00" ? 0 : 300}deg)` }} />
        </div>
      </div>

      {!clockHandFound && (
        <FloorItem 
          item={ITEMS.clock_hand} 
          className="absolute top-[15.5%] left-[8.5%] w-6 h-12 cursor-pointer z-30 flex items-center justify-center drop-shadow-lg transition-transform hover:scale-110 -rotate-45"
          onClick={() => setClockHandFound(true)} 
        />
      )}

      {/* Tsun Character Area */}
      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-full h-1/2 flex flex-col items-center justify-end" onMouseUp={handleTsunDrop}>
        <motion.div animate={isSurprised ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}} className="relative w-32 h-48 sm:w-40 sm:h-56">
          <img src={getTsunAvatar()} className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
        </motion.div>
      </div>

      {/* Waiter Animation (Stage 1 specific) */}
      <AnimatePresence>
        {waiterState !== 'idle' && (
          <motion.div initial={{ x: '100%' }} animate={{ x: waiterState === 'entering' || waiterState === 'serving' ? '20%' : '100%' }} className="absolute top-1/4 right-0 w-1/2 h-1/2 z-30 pointer-events-none">
            <img src={itemStaff} alt="Waiter" className="w-full h-full object-contain" />
            {waiterState === 'serving' && servedItem && (
              <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} className="absolute top-1/2 -left-10 w-16 h-16 bg-white border-4 border-black rounded-full p-2 shadow-lg">
                <img src={SERVED_ASSETS[servedItem.toUpperCase()]} alt={servedItem} className="w-full h-full object-contain" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GameLayout>
  );
};
