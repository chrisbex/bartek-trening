import React from 'react';
import { Direction, Vulnerability, Contract, isSideVulnerable, parseCall } from '../logic/bridgeRules';

interface BiddingItem {
  call: string;
  by: Direction;
  explanation?: string;
}

interface BiddingHistoryProps {
  dealer: Direction;
  vulnerability: Vulnerability;
  history: BiddingItem[];
  contract?: Contract | null;
  fourColor?: boolean;
}

export const BiddingHistory: React.FC<BiddingHistoryProps> = ({
  dealer,
  vulnerability,
  history,
  contract,
  fourColor = true,
}) => {
  // Standard BBO order of columns: West, North, East, South
  const columns: Direction[] = ['W', 'N', 'E', 'S'];

  const isVul = (dir: Direction) => {
    const side = (dir === 'N' || dir === 'S') ? 'NS' : 'EW';
    return isSideVulnerable(side, vulnerability);
  };

  // Build grid rows: empty slots before the dealer
  const dealerColIdx = columns.indexOf(dealer);
  const cells: (BiddingItem | null)[] = [];

  for (let i = 0; i < dealerColIdx; i++) {
    cells.push(null);
  }

  history.forEach(item => {
    cells.push(item);
  });

  // Group into rows of 4
  const rows: (BiddingItem | null)[][] = [];
  for (let i = 0; i < cells.length; i += 4) {
    const row = cells.slice(i, i + 4);
    while (row.length < 4) {
      row.push(null);
    }
    rows.push(row);
  }

  const renderCallBadge = (item: BiddingItem) => {
    const parsed = parseCall(item.call);

    if (parsed.special === 'Pass') {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-700/80 text-white">
          PAS
        </span>
      );
    }

    if (parsed.special === 'X') {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-extrabold bg-red-600 text-white">
          X
        </span>
      );
    }

    if (parsed.special === 'XX') {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-extrabold bg-blue-600 text-white">
          XX
        </span>
      );
    }

    if (parsed.level && parsed.strain) {
      let suitSymbol = 'BA';
      let suitColor = 'text-blue-400';

      if (parsed.strain === 'S') { suitSymbol = '♠'; suitColor = 'text-white'; }
      else if (parsed.strain === 'H') { suitSymbol = '♥'; suitColor = 'text-red-400'; }
      else if (parsed.strain === 'D') { suitSymbol = '♦'; suitColor = fourColor ? 'text-amber-400' : 'text-red-400'; }
      else if (parsed.strain === 'C') { suitSymbol = '♣'; suitColor = fourColor ? 'text-emerald-400' : 'text-white'; }

      return (
        <div className="inline-flex items-center gap-0.5 font-bold text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
          <span className="text-white">{parsed.level}</span>
          <span className={suitColor}>{suitSymbol}</span>
        </div>
      );
    }

    return <span className="font-bold text-xs text-white">{item.call}</span>;
  };

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl select-none text-xs md:text-sm text-white w-full">
      {/* Header */}
      <div className="bg-slate-800/90 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
        <span className="font-extrabold text-slate-200 text-sm md:text-base">Przebieg licytacji</span>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="text-slate-400">Rozdający: <strong className="text-amber-300 font-bold">{dealer}</strong></span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            Partia: <strong className="text-slate-200 font-medium">{vulnerability === 'None' ? 'Przed partią' : vulnerability === 'All' ? 'Obie po partii' : `Po partii ${vulnerability}`}</strong>
          </span>
        </div>
      </div>

      {/* Columns Header (W, N, E, S) */}
      <div className="grid grid-cols-4 text-center font-black border-b border-slate-700 text-sm md:text-base">
        {columns.map(dir => {
          const vul = isVul(dir);
          return (
            <div
              key={dir}
              className={`py-2 transition-colors ${
                vul ? 'bg-red-950/80 text-red-200 border-b-2 border-red-500' : 'bg-slate-800/60 text-slate-200 border-b-2 border-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>{dir}</span>
                {dir === dealer && <span className="w-2 h-2 rounded-full bg-amber-400" title="Rozdający" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rows of calls */}
      <div className="divide-y divide-slate-800/80 max-h-56 md:max-h-72 overflow-y-auto font-mono text-xs md:text-sm">
        {rows.length === 0 ? (
          <div className="py-6 text-center text-slate-500 italic">Oczekiwanie na otwarcie...</div>
        ) : (
          rows.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-4 text-center py-2 hover:bg-slate-800/40">
              {row.map((item, cIdx) => (
                <div key={cIdx} className="flex flex-col items-center justify-center min-h-[30px] px-1">
                  {item ? (
                    <div className="group relative cursor-help">
                      {renderCallBadge(item)}
                      {item.explanation && (
                        <div className="hidden group-hover:block absolute bottom-full mb-1 z-30 bg-slate-950 text-amber-200 border border-amber-500/40 rounded px-2.5 py-1 text-xs whitespace-nowrap shadow-xl">
                          {item.explanation}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-600 font-bold">—</span>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Contract Banner if determined */}
      {contract && (
        <div className="bg-emerald-950/80 border-t border-emerald-500/40 px-4 py-2.5 flex items-center justify-between text-xs md:text-sm">
          <span className="text-emerald-300 font-bold">Wylicytowany kontrakt:</span>
          <span className="font-black text-white text-sm md:text-base bg-emerald-800/90 px-3 py-1 rounded-lg border border-emerald-400/50 shadow">
            {contract.level}
            {contract.strain === 'NT' ? 'BA' : contract.strain}
            {contract.doubled ? 'X' : ''}
            {contract.redoubled ? 'XX' : ''}
            <span className="text-xs font-medium text-emerald-200 ml-1.5">przez {contract.declarer}</span>
          </span>
        </div>
      )}
    </div>
  );
};
