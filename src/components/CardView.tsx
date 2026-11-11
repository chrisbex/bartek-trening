import React from 'react';
import { Card, Suit } from '../logic/bridgeRules';

interface CardViewProps {
  card: Card;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
  fourColor?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
  compact?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  onClick,
  isPlayable = true,
  isSelected = false,
  fourColor = true,
  size = 'md',
  hidden = false,
  compact = false,
}) => {
  // Suit symbol & colors
  const getSuitStyles = (suit: Suit) => {
    if (fourColor) {
      switch (suit) {
        case 'S': return { symbol: '♠', color: 'text-gray-900', bg: 'bg-white' };
        case 'H': return { symbol: '♥', color: 'text-red-600', bg: 'bg-white' };
        case 'D': return { symbol: '♦', color: 'text-amber-600', bg: 'bg-white' };
        case 'C': return { symbol: '♣', color: 'text-emerald-700', bg: 'bg-white' };
      }
    } else {
      // Traditional 2-color
      switch (suit) {
        case 'S': return { symbol: '♠', color: 'text-gray-900', bg: 'bg-white' };
        case 'H': return { symbol: '♥', color: 'text-red-600', bg: 'bg-white' };
        case 'D': return { symbol: '♦', color: 'text-red-600', bg: 'bg-white' };
        case 'C': return { symbol: '♣', color: 'text-gray-900', bg: 'bg-white' };
      }
    }
  };

  const { symbol, color } = getSuitStyles(card.suit);
  const displayRank = card.rank === 'T' ? '10' : card.rank;

  const sizeClasses = {
    sm: 'w-10 h-14 text-xs',
    md: 'w-14 h-20 text-base',
    lg: 'w-18 h-26 text-lg',
  }[size];

  if (hidden) {
    return (
      <div
        className={`${sizeClasses} bg-blue-900 border-2 border-blue-400/60 rounded-md shadow-md flex items-center justify-center relative overflow-hidden select-none`}
        title="Karta zakryta"
      >
        <div className="absolute inset-1 border border-blue-300/30 rounded flex items-center justify-center bg-blue-800/80 pattern-grid">
          <div className="w-4 h-5 border border-amber-300/40 rotate-45 flex items-center justify-center">
            <span className="text-[9px] text-amber-200/60 font-serif">B</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={isPlayable ? onClick : undefined}
      disabled={!isPlayable && !compact}
      aria-label={`Karta ${displayRank} ${card.suit}`}
      className={`
        ${sizeClasses}
        relative bg-white rounded-md shadow-sm border font-semibold select-none
        transition-all duration-150 flex flex-col justify-between p-1
        ${isSelected ? 'ring-2 ring-amber-400 -translate-y-2.5 shadow-lg border-amber-400' : 'border-gray-300'}
        ${isPlayable && onClick ? 'hover:-translate-y-1.5 hover:shadow-md cursor-pointer hover:border-blue-400' : ''}
        ${!isPlayable && onClick ? 'opacity-40 cursor-not-allowed filter grayscale-[20%]' : ''}
      `}
    >
      {/* Top left value + small suit */}
      <div className={`flex items-center justify-between leading-none ${color}`}>
        <span className="font-bold tracking-tighter">{displayRank}</span>
        <span className="text-xs">{symbol}</span>
      </div>

      {/* Center large suit symbol */}
      <div className={`flex-1 flex items-center justify-center text-lg leading-none ${color}`}>
        <span>{symbol}</span>
      </div>

      {/* Bottom right rotated rank */}
      <div className={`flex items-center justify-end leading-none rotate-180 ${color}`}>
        <span className="font-bold tracking-tighter text-[11px]">{displayRank}</span>
      </div>
    </button>
  );
};
