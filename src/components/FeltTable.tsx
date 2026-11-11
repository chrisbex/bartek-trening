import React from 'react';
import { Card, Direction, Vulnerability, Trick, Contract, isDirectionVulnerable, Suit } from '../logic/bridgeRules';
import { BBOCard } from './BBOCard';

interface FeltTableProps {
  hands: Record<Direction, Card[]>;
  currentTurn: Direction;
  dealer: Direction;
  vulnerability: Vulnerability;
  contract: Contract | null;
  currentTrick: Trick;
  nsTricksWon: number;
  ewTricksWon: number;
  isDummyVisible: boolean;
  openCards: boolean;
  fourColor: boolean;
  userSeat: Direction;
  isInteractive: boolean;
  playableCardIds: Set<string>;
  onPlayCard: (card: Card, playedBy: Direction) => void;
  onNextTrick?: () => void;
  waitingForNextTrick?: boolean;
  lastTrickWinner?: Direction | null;
}

// BBO standard alternating color suit order: ♠ Spades (Black), ♥ Hearts (Red), ♣ Clubs (Black), ♦ Diamonds (Red)
const BBO_SUIT_ORDER: Suit[] = ['S', 'H', 'C', 'D'];

export const FeltTable: React.FC<FeltTableProps> = ({
  hands,
  currentTurn,
  dealer,
  vulnerability,
  contract,
  currentTrick,
  nsTricksWon,
  ewTricksWon,
  isDummyVisible,
  openCards,
  fourColor,
  userSeat,
  isInteractive,
  playableCardIds,
  onPlayCard,
  onNextTrick,
  waitingForNextTrick = false,
  lastTrickWinner = null,
}) => {
  const dummyDirection = contract?.dummy ?? null;
  const declarerDirection = contract?.declarer ?? null;

  const isVul = (dir: Direction) => isDirectionVulnerable(dir, vulnerability);

  // Determine cards played in the active trick
  const playedByN = currentTrick.cards.find(c => c.playedBy === 'N');
  const playedByE = currentTrick.cards.find(c => c.playedBy === 'E');
  const playedByS = currentTrick.cards.find(c => c.playedBy === 'S');
  const playedByW = currentTrick.cards.find(c => c.playedBy === 'W');

  // Should seat cards be visible
  const shouldShowCards = (dir: Direction): boolean => {
    if (openCards) return true; // Teacher mode: all 4 hands exposed
    if (dir === userSeat) return true; // Trainee's own hand
    if (dir === dummyDirection && isDummyVisible) return true; // Dummy once lead is made
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
    BBO_SUIT_ORDER.forEach(s => {
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

  return (
    <div className="relative w-full h-full flex-1 rounded-2xl bg-[#175e4c] border-4 border-[#0f4437] shadow-2xl p-2.5 sm:p-4 pb-4 sm:pb-6 flex flex-col justify-between select-none min-h-[440px]">
      {/* Authentic BBO watermarks: Top-Left, Bottom-Right, and Center */}
      <div className="absolute top-2 left-3 pointer-events-none select-none opacity-20">
        <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-[#52ab94] font-serif">
          bbo
        </span>
      </div>
      <div className="absolute bottom-2 right-3 pointer-events-none select-none opacity-20">
        <span className="text-2xl sm:text-3xl font-black italic tracking-tighter text-[#52ab94] font-serif">
          bbo
        </span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <span className="text-[130px] sm:text-[180px] md:text-[220px] font-black italic tracking-tighter text-white font-serif">
          bbo
        </span>
      </div>

      {/* ================= NORTH (TOP) ================= */}
      <div className="flex flex-col items-center z-10 w-full mb-1">
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
        <div className="flex flex-col items-start shrink-0">
          {shouldShowCards('W') ? (
            <div className="flex flex-col gap-0.5 min-w-[120px] sm:min-w-[160px]">
              {BBO_SUIT_ORDER.map(suit => {
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
                          />
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center -space-x-3 sm:-space-x-4">
              {hands.W.map((c, idx) => (
                <BBOCard key={c.id || idx} card={c} hidden fourColor={fourColor} />
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
          <div className="w-full rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700/70 bg-[#96acb3] flex flex-col">
            {/* Top Vulnerability Tabs: W | N | E | S */}
            <div className="grid grid-cols-4 border-b-2 border-slate-700/80 text-center font-black text-sm select-none">
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
            <div className="relative h-44 sm:h-52 bg-[#9bb1b7] flex items-center justify-center p-2 shadow-inner">
              {/* Contract & Trick Summary in background */}
              <div className="text-center opacity-90 select-none pointer-events-none">
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
                  <div className="text-slate-800 font-bold text-xs sm:text-sm bg-white/70 px-3 py-1.5 rounded-md shadow-xs">
                    Faza licytacji
                  </div>
                )}
              </div>

              {/* Played Cards in Active Trick */}
              {/* North card (played to center from top) */}
              {playedByN && (
                <div className="absolute top-2 transition-transform animate-in fade-in duration-150 drop-shadow-md">
                  <BBOCard card={playedByN.card} fourColor={fourColor} isPlayable={false} />
                </div>
              )}
              {/* East card (played from right) */}
              {playedByE && (
                <div className="absolute right-4 transition-transform animate-in fade-in duration-150 drop-shadow-md">
                  <BBOCard card={playedByE.card} fourColor={fourColor} isPlayable={false} />
                </div>
              )}
              {/* South card (played from bottom) */}
              {playedByS && (
                <div className="absolute bottom-2 transition-transform animate-in fade-in duration-150 drop-shadow-md">
                  <BBOCard card={playedByS.card} fourColor={fourColor} isPlayable={false} />
                </div>
              )}
              {/* West card (played from left) */}
              {playedByW && (
                <div className="absolute left-4 transition-transform animate-in fade-in duration-150 drop-shadow-md">
                  <BBOCard card={playedByW.card} fourColor={fourColor} isPlayable={false} />
                </div>
              )}

              {/* Waiting for Next Trick Overlay */}
              {waitingForNextTrick && lastTrickWinner && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-20">
                  <span className="text-amber-300 font-black text-base sm:text-lg mb-2">
                    Lewę bierze {lastTrickWinner}!
                  </span>
                  {onNextTrick && (
                    <button
                      type="button"
                      onClick={onNextTrick}
                      className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-sm shadow-xl transition active:scale-95 cursor-pointer"
                    >
                      Następna lewa →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EAST (RIGHT) */}
        <div className="flex flex-col items-end shrink-0">
          {shouldShowCards('E') ? (
            <div className="flex flex-col gap-0.5 min-w-[120px] sm:min-w-[160px]">
              {BBO_SUIT_ORDER.map(suit => {
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
                          />
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center -space-x-3 sm:-space-x-4">
              {hands.E.map((c, idx) => (
                <BBOCard key={c.id || idx} card={c} hidden fourColor={fourColor} />
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
      <div className="flex flex-col items-center z-10 w-full mt-1">
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
