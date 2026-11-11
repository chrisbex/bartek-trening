import React from 'react';
import { Card, Direction, Suit, calculateHCP, SUITS_ORDER } from '../logic/bridgeRules';
import { CardView } from './CardView';

interface HandDisplayProps {
  direction: Direction;
  cards: Card[];
  isCurrentTurn: boolean;
  isDummy: boolean;
  isDeclarer: boolean;
  isLeader?: boolean;
  isUserSeat: boolean;
  showCards: boolean; // if false, display card backs or count
  fourColor: boolean;
  onCardClick?: (card: Card) => void;
  playableCardIds?: Set<string>;
  label?: string;
  horizontal?: boolean;
}

export const HandDisplay: React.FC<HandDisplayProps> = ({
  direction,
  cards,
  isCurrentTurn,
  isDummy,
  isDeclarer,
  isLeader = false,
  isUserSeat,
  showCards,
  fourColor,
  onCardClick,
  playableCardIds,
  label,
  horizontal = false,
}) => {
  const hcp = calculateHCP(cards);
  const dirNames: Record<Direction, string> = {
    N: 'N (Północ)',
    E: 'E (Wschód)',
    S: 'S (Południe)',
    W: 'W (Zachód)'
  };

  // Group cards by suit
  const cardsBySuit: Record<Suit, Card[]> = { S: [], H: [], D: [], C: [] };
  cards.forEach(c => {
    cardsBySuit[c.suit].push(c);
  });

  const getSuitHeader = (suit: Suit) => {
    if (fourColor) {
      switch (suit) {
        case 'S': return { symbol: '♠', color: 'text-gray-900 bg-gray-100' };
        case 'H': return { symbol: '♥', color: 'text-red-600 bg-red-50' };
        case 'D': return { symbol: '♦', color: 'text-amber-600 bg-amber-50' };
        case 'C': return { symbol: '♣', color: 'text-emerald-700 bg-emerald-50' };
      }
    } else {
      switch (suit) {
        case 'S': return { symbol: '♠', color: 'text-gray-900 bg-gray-100' };
        case 'H': return { symbol: '♥', color: 'text-red-600 bg-red-50' };
        case 'D': return { symbol: '♦', color: 'text-red-600 bg-red-50' };
        case 'C': return { symbol: '♣', color: 'text-gray-900 bg-gray-100' };
      }
    }
  };

  return (
    <div
      className={`
        relative rounded-xl p-2.5 md:p-3 transition-all duration-200 select-none
        ${isCurrentTurn ? 'ring-2 ring-amber-400 bg-black/50 shadow-xl shadow-amber-500/25' : 'bg-black/35'}
        border border-white/15 backdrop-blur-xs
        ${horizontal ? 'w-full max-w-4xl xl:max-w-5xl' : 'w-48 lg:w-56 xl:w-60'}
      `}
    >
      {/* Header with seat and status */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/15 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <span className={`
            font-extrabold px-2 py-0.5 rounded text-xs md:text-sm
            ${direction === 'N' || direction === 'S' ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}
          `}>
            {direction}
          </span>
          <span className="font-bold text-white text-xs md:text-sm truncate max-w-[140px] md:max-w-[220px]">
            {label || dirNames[direction]}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isDummy && (
            <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px] md:text-[11px] tracking-wider">
              DZIADEK
            </span>
          )}
          {isDeclarer && (
            <span className="bg-emerald-400 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px] md:text-[11px] tracking-wider">
              ROZGRYW.
            </span>
          )}
          {isLeader && !isDeclarer && !isDummy && (
            <span className="bg-indigo-500 text-white font-black px-1.5 py-0.5 rounded text-[10px] md:text-[11px] tracking-wider">
              WIST
            </span>
          )}
          {showCards && (
            <span className="text-amber-300 font-extrabold text-xs md:text-sm font-mono ml-1" title="Punkty Miltoena (HCP)">
              {hcp} PC
            </span>
          )}
        </div>
      </div>

      {/* Cards Content */}
      {!showCards ? (
        // Hidden opponent hand: show card count and card backs
        <div className="py-2 flex flex-col items-center justify-center min-h-[64px]">
          <div className="flex items-center -space-x-3.5 overflow-hidden py-1">
            {cards.map((c, idx) => (
              <CardView key={c.id || idx} card={c} hidden size="sm" />
            ))}
          </div>
          <span className="text-white/70 text-xs font-semibold mt-0.5">
            {cards.length} {cards.length === 1 ? 'karta' : cards.length < 5 ? 'karty' : 'kart'}
          </span>
        </div>
      ) : (
        // Exposed cards view: rectangular 4-column layout for horizontal hands (N and S)
        <div className={horizontal ? "grid grid-cols-4 gap-2 md:gap-3 items-stretch" : "space-y-1.5"}>
          {SUITS_ORDER.map(suit => {
            const suitCards = cardsBySuit[suit];
            const { symbol, color } = getSuitHeader(suit);

            return (
              <div
                key={suit}
                className={`
                  flex items-center gap-1.5 min-h-[32px]
                  ${horizontal ? 'bg-black/25 px-2 py-1 rounded-lg border border-white/5' : ''}
                `}
              >
                <span className={`w-6 h-6 rounded flex items-center justify-center text-xs md:text-sm font-black shrink-0 shadow-sm ${color}`}>
                  {symbol}
                </span>

                {suitCards.length === 0 ? (
                  <span className="text-white/30 text-xs italic pl-1">—</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1">
                    {suitCards.map(c => {
                      const isPlayable = playableCardIds ? playableCardIds.has(c.id) : isCurrentTurn;
                      const displayRank = c.rank === 'T' ? '10' : c.rank;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => isPlayable && onCardClick && onCardClick(c)}
                          disabled={!isPlayable}
                          aria-label={`Zagraj ${displayRank} ${c.suit}`}
                          className={`
                            min-w-[22px] md:min-w-[26px] h-7 md:h-7.5 px-1.5 rounded flex items-center justify-center text-xs md:text-sm font-black transition-all
                            ${isPlayable
                              ? 'bg-white text-slate-950 shadow-md hover:scale-115 hover:bg-amber-100 hover:ring-2 hover:ring-amber-400 cursor-pointer active:scale-95'
                              : 'bg-white/20 text-white/40 cursor-not-allowed'
                            }
                          `}
                        >
                          {displayRank}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
