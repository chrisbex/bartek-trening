import React from 'react';
import { Card, Suit } from '../logic/bridgeRules';

interface BBOCardProps {
  card: Card;
  onClick?: () => void;
  isPlayable?: boolean;
  polishRanks?: boolean; // 'D' for Q, 'W' for J
  fourColor?: boolean;
  hidden?: boolean;
  className?: string;
  size?: 'normal' | 'large' | 'compact';
}

export const BBOCard: React.FC<BBOCardProps> = ({
  card,
  onClick,
  isPlayable = true,
  polishRanks = true,
  fourColor = false,
  hidden = false,
  className = '',
  size = 'normal',
}) => {
  // Convert rank to Polish standard (D for Q, W for J)
  const getRankLabel = (rank: string) => {
    if (rank === 'T') return '10';
    if (polishRanks) {
      if (rank === 'Q') return 'D'; // Dama
      if (rank === 'J') return 'W'; // Walet
    }
    return rank;
  };

  const getSuitStyles = (suit: Suit) => {
    if (fourColor) {
      switch (suit) {
        case 'S':
          return { symbol: '♠', textColor: 'text-black', borderColor: 'border-black' };
        case 'H':
          return { symbol: '♥', textColor: 'text-[#b91c1c]', borderColor: 'border-[#b91c1c]' };
        case 'D':
          return { symbol: '♦', textColor: 'text-amber-600', borderColor: 'border-amber-600' };
        case 'C':
          return { symbol: '♣', textColor: 'text-emerald-700', borderColor: 'border-emerald-700' };
      }
    } else {
      // Classic BBO 2-color as in screenshot (Black ♠♣, Crimson Red ♥♦)
      switch (suit) {
        case 'S':
          return { symbol: '♠', textColor: 'text-black', borderColor: 'border-neutral-800' };
        case 'H':
          return { symbol: '♥', textColor: 'text-[#b91c1c]', borderColor: 'border-[#b91c1c]' };
        case 'D':
          return { symbol: '♦', textColor: 'text-[#b91c1c]', borderColor: 'border-[#b91c1c]' };
        case 'C':
          return { symbol: '♣', textColor: 'text-black', borderColor: 'border-neutral-800' };
      }
    }
  };

  const { symbol, textColor, borderColor } = getSuitStyles(card.suit);
  const rankLabel = getRankLabel(card.rank);

  // Sizing: Vertical rectangle with ~1:1.77 aspect ratio (authentic BBO card proportions)
  const sizeClasses = {
    compact: 'w-[54px] h-[90px] sm:w-[60px] sm:h-[102px]',
    normal: 'w-[60px] h-[102px] sm:w-[66px] sm:h-[113px] md:w-[69px] md:h-[117px]',
    large: 'w-[69px] h-[117px] sm:w-[75px] sm:h-[126px] md:w-[81px] md:h-[135px]',
  }[size];

  if (hidden) {
    return (
      <div
        className={`
          ${sizeClasses}
          bg-[#1e3a8a] border border-[#0f172a] rounded-[1px] shadow-sm
          flex items-center justify-center relative overflow-hidden select-none shrink-0
          ${className}
        `}
        title="Karta zakryta"
      >
        <div className="absolute inset-[4.5px] border border-blue-400/40 rounded-[1px] bg-[#1d4ed8] flex items-center justify-center">
          <div className="w-6 h-9 border border-amber-300/40 rotate-45 flex items-center justify-center">
          </div>
        </div>
      </div>
    );
  }

  const isTen = rankLabel === '10';

  return (
    <button
      type="button"
      onClick={isPlayable ? onClick : undefined}
      disabled={!isPlayable && !onClick}
      aria-label={`Karta ${rankLabel} ${symbol}`}
      className={`
        ${sizeClasses}
        bg-white border ${borderColor} rounded-[1px] shadow-xs
        flex flex-col items-center pt-1.5 pb-2.5 px-1 select-none shrink-0 font-sans
        transition-all duration-150 relative
        ${isPlayable && onClick ? 'hover:-translate-y-3 hover:shadow-lg hover:z-30 cursor-pointer active:translate-y-0 ring-1 ring-amber-400' : 'cursor-default'}
        ${className}
      `}
    >
      {/* Top: Polish Rank (Bold, sharp, prominent - like BBO) */}
      <span className={`${isTen ? 'text-2xl sm:text-[30px]' : 'text-3xl sm:text-4xl'} font-black leading-none ${textColor} tracking-tight`}>
        {rankLabel}
      </span>

      {/* Directly Underneath: Suit Symbol */}
      <span className={`text-2xl sm:text-[30px] font-black leading-none ${textColor} mt-1.5`}>
        {symbol}
      </span>
    </button>
  );
};

