import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Card, Direction, Vulnerability, Trick, Contract, isDirectionVulnerable, Suit } from '../logic/bridgeRules';
import { BBOCard } from './BBOCard';

interface BiddingItem {
  call: string;
  by: Direction;
  explanation?: string;
}

interface FeltTableProps {
  hands: Record<Direction, Card[]>;
  biddingHistory: BiddingItem[];
  currentTurn: Direction;
  dealer: Direction;
  vulnerability: Vulnerability;
  contract: Contract | null;
  currentTrick: Trick;
  nsTricksWon: number;
  ewTricksWon: number;
  openCards: boolean;
  fourColor: boolean;
  userSeat: Direction;
  isInteractive: boolean;
  playableCardIds: Set<string>;
  onPlayCard: (card: Card, playedBy: Direction) => void;
  waitingForNextTrick?: boolean;
  lastTrickWinner?: Direction | null;
  isCollectingTrick: boolean;
  trickTakeDurationMs: number;
}

// BBO standard alternating color suit order: ♠ Spades (Black), ♥ Hearts (Red), ♣ Clubs (Black), ♦ Diamonds (Red)
const BBO_SUIT_ORDER: Suit[] = ['S', 'H', 'C', 'D'];
const BIDDING_COLUMNS: Direction[] = ['W', 'N', 'E', 'S'];

export const FeltTable: React.FC<FeltTableProps> = ({
  hands,
  biddingHistory,
  currentTurn,
  dealer,
  vulnerability,
  contract,
  currentTrick,
  nsTricksWon,
  ewTricksWon,
  openCards,
  fourColor,
  userSeat,
  isInteractive,
  playableCardIds,
  onPlayCard,
  waitingForNextTrick = false,
  lastTrickWinner = null,
  isCollectingTrick,
  trickTakeDurationMs,
}) => {
  const dummyDirection = contract?.dummy ?? null;
  const declarerDirection = contract?.declarer ?? null;
  const isDummyRevealed = contract !== null;

  const isVul = (dir: Direction) => isDirectionVulnerable(dir, vulnerability);
  const contractSuit = contract && contract.strain !== 'NT' ? contract.strain : null;
  const currentSuitOrder = contractSuit
    ? [contractSuit, ...BBO_SUIT_ORDER.filter(suit => suit !== contractSuit)]
    : BBO_SUIT_ORDER;
  const [trickTakeOffsets, setTrickTakeOffsets] = useState<Partial<Record<Direction, { x: number; y: number }>>>({});
  const [isTrickTakeAnimating, setIsTrickTakeAnimating] = useState(false);
  const handAreaRefs = useRef<Record<Direction, HTMLDivElement | null>>({ N: null, E: null, S: null, W: null });
  const playedCardRefs = useRef<Record<Direction, HTMLDivElement | null>>({ N: null, E: null, S: null, W: null });

  useLayoutEffect(() => {
    if (!isCollectingTrick || !lastTrickWinner) {
      setIsTrickTakeAnimating(false);
      return;
    }

    const targetRect = handAreaRefs.current[lastTrickWinner]?.getBoundingClientRect();
    if (!targetRect) return;

    const targetX = targetRect.left + targetRect.width / 2;
    const targetY = targetRect.top + targetRect.height / 2;
    const offsets: Partial<Record<Direction, { x: number; y: number }>> = {};

    (['N', 'E', 'S', 'W'] as Direction[]).forEach(dir => {
      const cardRect = playedCardRefs.current[dir]?.getBoundingClientRect();
      if (!cardRect) return;
      offsets[dir] = {
        x: targetX - (cardRect.left + cardRect.width / 2),
        y: targetY - (cardRect.top + cardRect.height / 2),
      };
    });

    setTrickTakeOffsets(offsets);
    const frame = window.requestAnimationFrame(() => setIsTrickTakeAnimating(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isCollectingTrick, lastTrickWinner, currentTrick.cards.length]);

  const getTrickTakeStyle = (playedBy: Direction): React.CSSProperties => {
    const isTakingTrick = isTrickTakeAnimating && isCollectingTrick && waitingForNextTrick;
    const offset = trickTakeOffsets[playedBy] || { x: 0, y: 0 };

    return {
      transition: `transform ${trickTakeDurationMs}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity ${trickTakeDurationMs}ms ease-in`,
      transform: `translate(${isTakingTrick ? offset.x : 0}px, ${isTakingTrick ? offset.y : 0}px) scale(${isTakingTrick ? 0.55 : 1})`,
      opacity: isTakingTrick ? 0 : 1,
    };
  };

  // Determine cards played in the active trick
  const playedByN = currentTrick.cards.find(c => c.playedBy === 'N');
  const playedByE = currentTrick.cards.find(c => c.playedBy === 'E');
  const playedByS = currentTrick.cards.find(c => c.playedBy === 'S');
  const playedByW = currentTrick.cards.find(c => c.playedBy === 'W');

  // Should seat cards be visible
  const shouldShowCards = (dir: Direction): boolean => {
    if (openCards) return true; // Teacher mode: all 4 hands exposed
    if (dir === userSeat) return true; // Trainee's own hand
    if (dir === dummyDirection && isDummyRevealed) return true;
    return false;
  };

  // Group hand cards by BBO suit order (♠, ♥, ♣, ♦)
  const getGroupedHand = (dir: Direction) => {
    const list = hands[dir] || [];
    const grouped: Record<Suit, Card[]> = { S: [], H: [], C: [], D: [] };
    list.forEach(card => {
      grouped[card.suit].push(card);
    });
    return grouped;
  };

  // All cards sorted for horizontal strip (North and South)
  const getSortedStrip = (dir: Direction) => {
    const grouped = getGroupedHand(dir);
    const strip: Card[] = [];
    currentSuitOrder.forEach(s => {
      strip.push(...grouped[s]);
    });
    return strip;
  };

  // Calculate HCP
  const getHCP = (dir: Direction) => {
    const list = hands[dir] || [];
    return list.reduce((sum, c) => {
      if (c.rank === 'A') return sum + 4;
      if (c.rank === 'K') return sum + 3;
      if (c.rank === 'Q') return sum + 2;
      if (c.rank === 'J') return sum + 1;
      return sum;
    }, 0);
  };

  const biddingCells: (BiddingItem | null)[] = Array(BIDDING_COLUMNS.indexOf(dealer)).fill(null);
  biddingCells.push(...biddingHistory);
  const biddingRows: (BiddingItem | null)[][] = [];
  for (let i = 0; i < biddingCells.length; i += 4) {
    const row = biddingCells.slice(i, i + 4);
    while (row.length < 4) row.push(null);
    biddingRows.push(row);
  }
  const biddingRowsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rows = biddingRowsRef.current;
    if (rows) rows.scrollTop = rows.scrollHeight;
  }, [biddingHistory.length]);

  return (
    <div className="relative w-full h-full flex-1 rounded-2xl bg-[#175e4c] border-4 border-[#0f4437] shadow-2xl p-2.5 sm:p-4 pb-4 sm:pb-6 flex flex-col justify-between select-none min-h-[440px]">
      {/* ================= NORTH (TOP) ================= */}
      <div ref={element => { handAreaRefs.current.N = element; }} className="flex flex-col items-center z-10 w-full mb-1">
        {/* Horizontal strip of cards */}
        {shouldShowCards('N') ? (
          <div className="flex items-center -space-x-[1px] overflow-x-auto max-w-full justify-center">
            {getSortedStrip('N').map(card => {
              const isPlayable = isInteractive && currentTurn === 'N' && playableCardIds.has(card.id);
              return (
                <BBOCard
                  key={card.id}
                  card={card}
                  onClick={() => onPlayCard(card, 'N')}
                  isPlayable={isPlayable}
                  fourColor={fourColor}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center -space-x-3 sm:-space-x-4">
            {hands.N.map((c, idx) => (
              <BBOCard key={c.id || idx} card={c} hidden fourColor={fourColor} />
            ))}
          </div>
        )}

        {/* BBO Sage-Green Seat Bar */}
        <div className={`
          flex items-center justify-between px-2.5 py-0.5 bg-[#cad8c4] text-slate-900 text-xs sm:text-sm font-bold rounded-b shadow-sm w-full max-w-md sm:max-w-lg
          ${currentTurn === 'N' ? 'ring-2 ring-amber-400' : ''}
        `}>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 bg-[#1a5068] text-white rounded-[2px] flex items-center justify-center text-[11px] font-black">
              N
            </span>
            <span className="truncate">
              {dummyDirection === 'N' ? 'North - Dziadek' : declarerDirection === 'N' ? 'North - Rozgrywający' : 'North - Usiądź!'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">
            {shouldShowCards('N') ? `${getHCP('N')} PC` : `${hands.N.length} kart`}
          </span>
        </div>
      </div>

      {/* ================= MIDDLE SECTION: WEST + BBO TABLE BOARD + EAST ================= */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 z-10 flex-1 my-2 w-full">
        {/* WEST (LEFT) */}
        <div ref={element => { handAreaRefs.current.W = element; }} className="flex flex-col items-start shrink-0">
          {shouldShowCards('W') ? (
            <div className="flex flex-col gap-0.5 min-w-[120px] sm:min-w-[160px]">
              {currentSuitOrder.map(suit => {
                const suitCards = getGroupedHand('W')[suit];
                return (
                  <div key={suit} className="flex items-center -space-x-[1px] min-h-[40px] sm:min-h-[48px]">
                    {suitCards.length === 0 ? (
                      <span className="text-white/20 text-xs italic pl-2">—</span>
                    ) : (
                      suitCards.map(card => {
                        const isPlayable = isInteractive && currentTurn === 'W' && playableCardIds.has(card.id);
                        return (
                          <BBOCard
                            key={card.id}
                            card={card}
                            onClick={() => onPlayCard(card, 'W')}
                            isPlayable={isPlayable}
                            fourColor={fourColor}
                            size="large"
                          />
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center -space-y-[97px] sm:-space-y-[106px] md:-space-y-[115px]">
              {hands.W.map((c, idx) => (
                <BBOCard key={c.id || idx} card={c} hidden fourColor={fourColor} size="large" />
              ))}
            </div>
          )}

          {/* West Seat Bar */}
          <div className={`
            flex items-center justify-between px-2.5 py-0.5 bg-[#cad8c4] text-slate-900 text-xs font-bold rounded-b shadow-sm w-full min-w-[120px] sm:min-w-[160px] mt-0.5
            ${currentTurn === 'W' ? 'ring-2 ring-amber-400' : ''}
          `}>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-[#1a5068] text-white rounded-[2px] flex items-center justify-center text-[11px] font-black">
                W
              </span>
              <span className="truncate">
                {dummyDirection === 'W' ? 'West - Dziadek' : declarerDirection === 'W' ? 'West - Rozgryw.' : 'West - Usiądź!'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              {shouldShowCards('W') ? `${getHCP('W')} PC` : `${hands.W.length} kart`}
            </span>
          </div>
        </div>

        {/* ================= BBO CENTER BOARD (VULNERABILITY TABS + TRICK FELT) ================= */}
        <div className="relative flex-1 max-w-[280px] sm:max-w-[340px] md:max-w-[380px] h-full min-h-[200px] flex items-center justify-center mx-auto">
          <div className="w-full rounded-xl shadow-2xl border-2 border-slate-700/70 bg-[#96acb3] flex flex-col">
            {/* Top Vulnerability Tabs: W | N | E | S */}
            <div className="grid grid-cols-4 rounded-t-[10px] overflow-hidden border-b-2 border-slate-700/80 text-center font-black text-sm select-none">
              {(['W', 'N', 'E', 'S'] as Direction[]).map(dir => {
                const vul = isVul(dir);
                const isDealer = dealer === dir;

                return (
                  <div
                    key={dir}
                    className={`
                      py-1.5 transition-colors relative flex items-center justify-center gap-1
                      ${vul ? 'bg-[#c41616] text-white' : 'bg-white text-slate-950'}
                    `}
                  >
                    <span>{dir}</span>
                    {isDealer && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-slate-900 shadow-xs" title="Rozdający" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Inner Trick Surface (Smooth BBO grayish-blue felt #9bb1b7) */}
            <div className="relative h-44 sm:h-52 rounded-b-[10px] bg-[#9bb1b7] flex items-center justify-center p-2 shadow-inner">
              <div className={`text-center opacity-90 select-none ${contract ? 'pointer-events-none' : 'w-full max-w-[320px]'}`}>
                {contract ? (
                  <div>
                    <div className="text-slate-900 font-black text-base sm:text-lg tracking-tight">
                      {contract.level}{contract.strain === 'NT' ? 'BA' : contract.strain}{contract.doubled ? 'X' : ''} przez {contract.declarer}
                    </div>
                    <div className="text-xs font-bold text-slate-700">
                      Wymagane: {6 + contract.level} lew
                    </div>
                    <div className="text-xs font-black text-slate-900 bg-white/80 px-2.5 py-0.5 rounded shadow-xs mt-1.5 inline-block">
                      NS: {nsTricksWon} | EW: {ewTricksWon}
                    </div>
                  </div>
                ) : (
                  <div className="w-full rounded-lg bg-slate-950/80 border border-slate-700 px-2 py-1.5 text-white shadow-lg">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-1">
                      Przebieg licytacji
                    </div>
                    <div className="grid grid-cols-4 gap-1 mb-1 text-[10px] font-black">
                      {BIDDING_COLUMNS.map(dir => (
                        <div
                          key={dir}
                          className={`rounded py-0.5 ${
                            currentTurn === dir
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {dir}{dealer === dir ? ' •' : ''}
                        </div>
                      ))}
                    </div>
                    <div ref={biddingRowsRef} className="max-h-[112px] overflow-y-auto">
                      {biddingRows.length === 0 ? (
                        <div className="py-2 text-[10px] text-slate-400 italic">
                          Oczekiwanie na pierwszą odzywkę…
                        </div>
                      ) : (
                        biddingRows.map((row, rowIndex) => (
                          <div key={rowIndex} className="grid grid-cols-4 border-t border-slate-700/70">
                            {row.map((item, columnIndex) => (
                              <div key={columnIndex} className="min-h-6 flex items-center justify-center">
                                {item ? (
                                  <span
                                    title={item.explanation}
                                    className={`min-w-7 rounded px-1 py-0.5 text-[10px] font-bold ${
                                      item.call.toUpperCase() === 'PASS'
                                        ? 'text-emerald-300'
                                        : 'text-white'
                                    }`}
                                  >
                                    {item.call.toUpperCase() === 'PASS' ? 'PAS' : item.call}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Played Cards in Active Trick */}
              {/* North card (played to center from top) */}
              {playedByN && (
                <div ref={element => { playedCardRefs.current.N = element; }} className="absolute top-2 z-30 drop-shadow-md pointer-events-none" style={getTrickTakeStyle('N')}>
                  <BBOCard card={playedByN.card} fourColor={fourColor} isPlayable={false} />
                </div>
              )}
              {/* East card (played from right) */}
              {playedByE && (
                <div ref={element => { playedCardRefs.current.E = element; }} className="absolute right-4 z-30 drop-shadow-md pointer-events-none" style={getTrickTakeStyle('E')}>
                  <BBOCard card={playedByE.card} fourColor={fourColor} isPlayable={false} />
                </div>
              )}
              {/* South card (played from bottom) */}
              {playedByS && (
                <div ref={element => { playedCardRefs.current.S = element; }} className="absolute bottom-2 z-30 drop-shadow-md pointer-events-none" style={getTrickTakeStyle('S')}>
                  <BBOCard card={playedByS.card} fourColor={fourColor} isPlayable={false} />
                </div>
              )}
              {/* West card (played from left) */}
              {playedByW && (
                <div ref={element => { playedCardRefs.current.W = element; }} className="absolute left-4 z-30 drop-shadow-md pointer-events-none" style={getTrickTakeStyle('W')}>
                  <BBOCard card={playedByW.card} fourColor={fourColor} isPlayable={false} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EAST (RIGHT) */}
        <div ref={element => { handAreaRefs.current.E = element; }} className="flex flex-col items-end shrink-0">
          {shouldShowCards('E') ? (
            <div className="flex flex-col gap-0.5 min-w-[120px] sm:min-w-[160px]">
              {currentSuitOrder.map(suit => {
                const suitCards = getGroupedHand('E')[suit];
                return (
                  <div key={suit} className="flex items-center -space-x-[1px] min-h-[40px] sm:min-h-[48px] justify-end">
                    {suitCards.length === 0 ? (
                      <span className="text-white/20 text-xs italic pr-2">—</span>
                    ) : (
                      suitCards.map(card => {
                        const isPlayable = isInteractive && currentTurn === 'E' && playableCardIds.has(card.id);
                        return (
                          <BBOCard
                            key={card.id}
                            card={card}
                            onClick={() => onPlayCard(card, 'E')}
                            isPlayable={isPlayable}
                            fourColor={fourColor}
                            size="large"
                          />
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center -space-y-[97px] sm:-space-y-[106px] md:-space-y-[115px]">
              {hands.E.map((c, idx) => (
                <BBOCard key={c.id || idx} card={c} hidden fourColor={fourColor} size="large" />
              ))}
            </div>
          )}

          {/* East Seat Bar */}
          <div className={`
            flex items-center justify-between px-2.5 py-0.5 bg-[#cad8c4] text-slate-900 text-xs font-bold rounded-b shadow-sm w-full min-w-[120px] sm:min-w-[160px] mt-0.5
            ${currentTurn === 'E' ? 'ring-2 ring-amber-400' : ''}
          `}>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 bg-[#1a5068] text-white rounded-[2px] flex items-center justify-center text-[11px] font-black">
                E
              </span>
              <span className="truncate">
                {dummyDirection === 'E' ? 'East - Dziadek' : declarerDirection === 'E' ? 'East - Rozgryw.' : 'East - Usiądź!'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              {shouldShowCards('E') ? `${getHCP('E')} PC` : `${hands.E.length} kart`}
            </span>
          </div>
        </div>
      </div>

      {/* ================= SOUTH (BOTTOM) ================= */}
      <div ref={element => { handAreaRefs.current.S = element; }} className="flex flex-col items-center z-10 w-full mt-1">
        {/* Horizontal strip of cards */}
        {shouldShowCards('S') ? (
          <div className="flex items-center -space-x-[1px] overflow-x-auto max-w-full justify-center">
            {getSortedStrip('S').map(card => {
              const isPlayable = isInteractive && currentTurn === 'S' && playableCardIds.has(card.id);
              return (
                <BBOCard
                  key={card.id}
                  card={card}
                  onClick={() => onPlayCard(card, 'S')}
                  isPlayable={isPlayable}
                  fourColor={fourColor}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center -space-x-3 sm:-space-x-4">
            {hands.S.map((c, idx) => (
              <BBOCard key={c.id || idx} card={c} hidden fourColor={fourColor} />
            ))}
          </div>
        )}

        {/* BBO Light-Cream Seat Bar with Crown & Name */}
        <div className={`
          flex items-center justify-between px-3 py-1 bg-[#d9deda] text-slate-900 text-xs sm:text-sm font-bold rounded-b shadow-sm w-full max-w-md sm:max-w-lg
          ${currentTurn === 'S' ? 'ring-2 ring-amber-400' : ''}
        `}>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-[#1a5068] text-white rounded-[2px] flex items-center justify-center text-[11px] font-black">
              S
            </span>
            <span className="font-extrabold flex items-center gap-1">
              👑 {declarerDirection === 'S' ? 'Rozgrywający (Twój uczeń)' : dummyDirection === 'S' ? 'Dziadek (S)' : 'Twój uczeń (S)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-700">
              {getHCP('S')} PC
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-950 text-white text-[11px] font-serif font-black italic shadow-xs">
              1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
