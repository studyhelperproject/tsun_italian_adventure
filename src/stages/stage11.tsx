import React from 'react';
import { Coffee, Hand } from 'lucide-react';
import { StageConfig } from '../types';

export const stage11: StageConfig = {
  id: 11,
  title: "Stage 11: Tsun's Italian Adventure",
  description: "午後2時にカプチーノを頼もうとするつんを止めよう！",
  initialTime: "14:00",
  initialDialog: "つん：『午後2時か...。よし、カプチーノを注文しよう！』",
  backgroundImage: "https://picsum.photos/seed/italy/800/600",
  items: {
    espresso_menu: {
      id: 'espresso_menu',
      name: 'エスプレッソメニュー',
      icon: <Coffee />,
      description: '本場イタリアの苦いコーヒー。'
    },
    cappuccino_menu: {
      id: 'cappuccino_menu',
      name: 'カプチーノメニュー',
      icon: <Coffee />,
      description: '朝に飲むのがイタリア流。'
    },
    pasta_menu: {
      id: 'pasta_menu',
      name: 'パスタメニュー',
      icon: <Coffee />,
      description: 'お腹が空いた時に。'
    },
    wine_menu: {
      id: 'wine_menu',
      name: 'ワインメニュー',
      icon: <Coffee />,
      description: '大人の飲み物。'
    },
    clock_hand: {
      id: 'clock_hand',
      name: '時計の短針',
      icon: <Hand />,
      description: '折れた時計の針。'
    }
  },
  menuPositions: {
    cappuccino_menu: { bottom: '4%', left: '10%', rotate: '-10deg' },
    espresso_menu: { bottom: '6%', left: '35%', rotate: '5deg' },
    pasta_menu: { bottom: '3%', left: '60%', rotate: '-5deg' },
    wine_menu: { bottom: '7%', left: '80%', rotate: '15deg' },
  },
  floorItemIds: ['cappuccino_menu', 'espresso_menu', 'pasta_menu', 'wine_menu'],
  clockHandId: 'clock_hand',
  onDrop: (target, activeItem, { 
    time, setTime, setDialog, setGameState, triggerSound, setIsSurprised, 
    inventory, setInventory, setActiveItem, setIsReadingMenu, setWaiterState, setServedItem 
  }) => {
    if (target === 'tsun') {
      const menuIds = ['espresso_menu', 'cappuccino_menu', 'pasta_menu', 'wine_menu'];
      
      if (menuIds.includes(activeItem.id)) {
        const currentItemId = activeItem.id;
        setIsReadingMenu(true);
        triggerSound('use');
        setDialog(`つん：『どれどれ... ${activeItem.name}を読んでみよう。』`);
        
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
                    setGameState('fail');
                    setDialog("つん：『うわぁぁ！午後にカプチーノを頼むなんて、イタリアではありえないんだって！笑われちゃった...』");
                    triggerSound('fail');
                  } else {
                    setGameState('success');
                    setDialog("つん：『やった！午前中のカプチーノは最高だね！イタリア人みたい！』");
                    triggerSound('success');
                  }
                } else if (currentItemId === 'pasta_menu' || currentItemId === 'wine_menu') {
                  setGameState('sleeping');
                  setDialog("つん：『お腹いっぱい... 眠くなってきちゃった... むにゃむにゃ...』");
                  triggerSound('fail');
                } else if (currentItemId === 'espresso_menu') {
                  setGameState('espresso_fail');
                  setDialog("つん：『に、にがーーい！！思わず頭から被っちゃったよ！！』");
                  triggerSound('fail');
                }
              }, 1000);
            }, 1500);
          }, 1500);
        }, 2000);
        
        setInventory(inventory.filter(i => i.id !== activeItem.id));
        setActiveItem(null);
        return true;
      }
    }

    if (target === 'clock' && activeItem.id === 'clock_hand') {
      triggerSound('success');
      setIsSurprised(true);
      setTimeout(() => {
        setIsSurprised(false);
        setTime("10:00");
        setDialog("時間を午前10時に戻した！これならカプチーノもOKだ。");
      }, 1000);
      setActiveItem(null);
      setInventory(inventory.filter(i => i.id !== activeItem.id));
      return true;
    }

    return false;
  }
};
