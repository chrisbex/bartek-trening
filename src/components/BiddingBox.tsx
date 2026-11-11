import React, { useState } from 'react';
import { Strain, Call, Direction, isValidCall } from '../logic/bridgeRules';

interface BiddingBoxProps {
  onMakeCall: (call: Call, explanation?: string) => void;
  history: { call: string; by: Direction }[];
  currentTurn: Direction;
  recommendedNextCall?: string;
  recommendedExplanation?: string;
  disabled?: boolean;
}

export const BiddingBox: React.FC<BiddingBoxProps> = ({
  onMakeCall,
  history,
  currentTurn,
  recommendedNextCall,
  recommendedExplanation,
  disabled = false,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(1);
  const [explanation, setExplanation] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);

  const levels = [1, 2, 3, 4, 5, 6, 7];
  const strains: { strain: Strain; label: string; symbol: string; color: string }[] = [
    { strain: 'C', label: 'Trefl', symbol: '♣', color: 'text-emerald-700 hover:bg-emerald-50' },
    { strain: 'D', label: 'Karo', symbol: '♦', color: 'text-amber-600 hover:bg-amber-50' },
    { strain: 'H', label: 'Kier', symbol: '♥', color: 'text-red-600 hover:bg-red-50' },
    { strain: 'S', label: 'Pik', symbol: '♠', color: 'text-slate-900 hover:bg-slate-100' },
    { strain: 'NT', label: 'Bez atu (BA)', symbol: 'BA', color: 'text-blue-700 hover:bg-blue-50 font-bold' },
  ];

  const handleStrainClick = (strain: Strain) => {
    if (!selectedLevel || disabled) return;
    const call = `${selectedLevel}${strain}`;
    if (isValidCall(call, history)) {
      onMakeCall(call, explanation.trim() || undefined);
      setExplanation('');
    }
  };

  const handleSpecialCall = (call: 'Pass' | 'X' | 'XX') => {
    if (disabled) return;
    if (isValidCall(call, history)) {
      onMakeCall(call, explanation.trim() || undefined);
      setExplanation('');
    }
  };

  const isCallLegal = (callStr: string) => {
    return isValidCall(callStr, history);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-md w-full select-none text-white">
      {/* Box Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-700 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-extrabold text-slate-200">Bidding Box (Skrzynka licytacyjna)</span>
        </div>
        <span className="text-amber-400 font-black text-sm md:text-base">Ruch: {currentTurn}</span>
      </div>

      {/* Recommended Teacher Hint if available */}
      {recommendedNextCall && (
        <div className="mb-3 p-2.5 bg-blue-950/80 border border-blue-500/40 rounded-xl text-xs md:text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-300 font-bold">Podpowiedź trenera:</span>
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-amber-400 hover:underline text-xs font-bold cursor-pointer"
            >
              {showHint ? 'Ukryj wskazówkę' : 'Zobacz zalecaną odzywkę'}
            </button>
          </div>
          {showHint && (
            <div className="mt-1.5 pt-1.5 border-t border-blue-800/50 text-blue-100 flex items-center justify-between">
              <span>
                Zalecana: <strong className="text-amber-300 font-black text-base ml-1">{recommendedNextCall}</strong>
                {recommendedExplanation && <span className="text-blue-200 block text-xs mt-0.5">{recommendedExplanation}</span>}
              </span>
              <button
                type="button"
                onClick={() => {
                  onMakeCall(recommendedNextCall, recommendedExplanation);
                  setShowHint(false);
                }}
                className="ml-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs md:text-sm transition cursor-pointer shadow"
              >
                Zalicytuj ({recommendedNextCall})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Levels 1 to 7 selector */}
      <div className="grid grid-cols-7 gap-1.5 mb-2.5">
        {levels.map(lvl => (
          <button
            key={lvl}
            type="button"
            onClick={() => setSelectedLevel(lvl)}
            disabled={disabled}
            aria-label={`Wysokość ${lvl}`}
            className={`
              h-11 md:h-12 font-black text-base md:text-lg rounded-lg transition-all cursor-pointer
              ${selectedLevel === lvl
                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300 scale-105'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }
            `}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* Suit / Strain selectors */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {strains.map(({ strain, symbol, color }) => {
          const call = selectedLevel ? `${selectedLevel}${strain}` : '';
          const legal = selectedLevel ? isCallLegal(call) : false;

          return (
            <button
              key={strain}
              type="button"
              onClick={() => handleStrainClick(strain)}
              disabled={disabled || !legal}
              aria-label={`Odzywka ${selectedLevel}${strain}`}
              className={`
                h-12 md:h-14 rounded-xl font-black text-xl md:text-2xl flex items-center justify-center transition-all bg-white shadow-md
                ${color}
                ${legal
                  ? 'hover:scale-105 cursor-pointer active:scale-95 ring-2 ring-slate-200 hover:ring-amber-400'
                  : 'opacity-25 cursor-not-allowed bg-gray-200 text-gray-400'
                }
              `}
            >
              <span className="text-sm mr-1 text-slate-500 font-semibold">{selectedLevel}</span>
              <span>{symbol}</span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons: PASS, DBL, RDBL */}
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        {/* Pass Button (Classic BBO Green) */}
        <button
          type="button"
          onClick={() => handleSpecialCall('Pass')}
          disabled={disabled || !isCallLegal('Pass')}
          className="h-12 md:h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base md:text-lg rounded-xl shadow-lg flex items-center justify-center transition active:scale-95 cursor-pointer"
        >
          PAS
        </button>

        {/* Double Button (Classic BBO Red) */}
        <button
          type="button"
          onClick={() => handleSpecialCall('X')}
          disabled={disabled || !isCallLegal('X')}
          className={`
            h-12 md:h-14 font-black text-sm md:text-base rounded-xl shadow-lg flex items-center justify-center transition
            ${isCallLegal('X')
              ? 'bg-rose-600 hover:bg-rose-500 text-white active:scale-95 cursor-pointer'
              : 'bg-rose-950/40 text-rose-500/30 cursor-not-allowed border border-rose-900/30'
            }
          `}
        >
          KONTRA (X)
        </button>

        {/* Redouble Button (Classic BBO Blue) */}
        <button
          type="button"
          onClick={() => handleSpecialCall('XX')}
          disabled={disabled || !isCallLegal('XX')}
          className={`
            h-12 md:h-14 font-black text-sm md:text-base rounded-xl shadow-lg flex items-center justify-center transition
            ${isCallLegal('XX')
              ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 cursor-pointer'
              : 'bg-blue-950/40 text-blue-500/30 cursor-not-allowed border border-blue-900/30'
            }
          `}
        >
          REKONTRA (XX)
        </button>
      </div>

      {/* Optional Alert / Teacher Convention Note */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Wyjaśnienie / alert (np. Transfer, Stayman)..."
          aria-label="Wyjaśnienie odzywki"
          className="flex-1 bg-slate-800 text-xs md:text-sm px-3 py-2 rounded-lg border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </div>
  );
};
