import React, { useState } from 'react';
import { Card, Direction, Vulnerability, Suit, Rank, SUITS_ORDER, RANKS_ORDER, createCard, sortHand, generateFullDeck, shuffleCards, calculateHCP } from '../logic/bridgeRules';
import { Deal } from '../types/bridge';
import { formatPbnHand, parsePbnHand, importFromPbn } from '../utils/pbnParser';
import { X, Sparkles, Shuffle, FileText, Check, AlertCircle } from 'lucide-react';

interface DealEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDeal: (deal: Deal) => void;
  initialDeal?: Deal | null;
}

export const DealEditorModal: React.FC<DealEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveDeal,
  initialDeal,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'pbn'>('visual');
  const [selectedSeat, setSelectedSeat] = useState<Direction>('S');

  // Form states
  const [title, setTitle] = useState(initialDeal?.title || 'Nowe rozdanie szkoleniowe');
  const [category, setCategory] = useState(initialDeal?.category || 'Rozgrywka');
  const [difficulty, setDifficulty] = useState<'Początkujący' | 'Średniozaawansowany' | 'Zaawansowany'>(
    initialDeal?.difficulty || 'Średniozaawansowany'
  );
  const [dealer, setDealer] = useState<Direction>(initialDeal?.dealer || 'S');
  const [vulnerability, setVulnerability] = useState<Vulnerability>(initialDeal?.vulnerability || 'None');
  const [teacherGoal, setTeacherGoal] = useState(initialDeal?.teacherGoal || '');
  const [generalNotes, setGeneralNotes] = useState(initialDeal?.generalNotes || '');
  const [auctionInput, setAuctionInput] = useState(initialDeal?.recommendedAuction?.join(' ') || '1NT Pass 3NT Pass Pass Pass');

  // Hands state: Map from Direction to Card[]
  const [hands, setHands] = useState<Record<Direction, Card[]>>(() => {
    if (initialDeal) return initialDeal.hands;
    return { N: [], E: [], S: [], W: [] };
  });

  // PBN raw input
  const [pbnRaw, setPbnRaw] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Track which cards are already assigned to which seat
  const cardAssignments: Map<string, Direction> = new Map();
  (['N', 'E', 'S', 'W'] as Direction[]).forEach(dir => {
    hands[dir].forEach(card => {
      cardAssignments.set(card.id, dir);
    });
  });

  const fullDeck = generateFullDeck();

  const handleCardClick = (card: Card) => {
    const currentOwner = cardAssignments.get(card.id);

    setHands(prev => {
      const nextHands = {
        N: [...prev.N],
        E: [...prev.E],
        S: [...prev.S],
        W: [...prev.W],
      };

      if (currentOwner === selectedSeat) {
        // Remove from current selected seat
        nextHands[selectedSeat] = nextHands[selectedSeat].filter(c => c.id !== card.id);
      } else {
        // If owned by someone else, remove from them first
        if (currentOwner) {
          nextHands[currentOwner] = nextHands[currentOwner].filter(c => c.id !== card.id);
        }
        // Add to selected seat if less than 13
        if (nextHands[selectedSeat].length < 13) {
          nextHands[selectedSeat].push(card);
          nextHands[selectedSeat] = sortHand(nextHands[selectedSeat]);
        }
      }

      return nextHands;
    });
  };

  // Fill remaining unassigned cards randomly among hands that have fewer than 13 cards
  const handleAutoCompleteRemaining = () => {
    const unassigned = fullDeck.filter(c => !cardAssignments.has(c.id));
    const shuffled = shuffleCards(unassigned);

    setHands(prev => {
      const next = {
        N: [...prev.N],
        E: [...prev.E],
        S: [...prev.S],
        W: [...prev.W],
      };

      const dirs: Direction[] = ['N', 'E', 'S', 'W'];
      for (const card of shuffled) {
        const targetDir = dirs.find(d => next[d].length < 13);
        if (targetDir) {
          next[targetDir].push(card);
        }
      }

      dirs.forEach(d => {
        next[d] = sortHand(next[d]);
      });

      return next;
    });
  };

  // Generate complete random deal
  const handleRandomizeAll = () => {
    const shuffled = shuffleCards(fullDeck);
    setHands({
      N: sortHand(shuffled.slice(0, 13)),
      E: sortHand(shuffled.slice(13, 26)),
      S: sortHand(shuffled.slice(26, 39)),
      W: sortHand(shuffled.slice(39, 52)),
    });
  };

  const handleClearAll = () => {
    setHands({ N: [], E: [], S: [], W: [] });
  };

  // PBN Import
  const handleImportPbn = () => {
    setErrorMessage(null);
    if (!pbnRaw.trim()) {
      setErrorMessage('Wprowadź tekst w formacie PBN.');
      return;
    }
    const imported = importFromPbn(pbnRaw);
    if (!imported || !imported.hands) {
      setErrorMessage('Nie udało się rozpoznać formatu PBN. Upewnij się, że zawiera tag [Deal "..."] lub 4 ręce.');
      return;
    }

    setHands(imported.hands);
    if (imported.title) setTitle(imported.title);
    if (imported.dealer) setDealer(imported.dealer);
    if (imported.vulnerability) setVulnerability(imported.vulnerability);
    if (imported.teacherGoal) setTeacherGoal(imported.teacherGoal);
    if (imported.generalNotes) setGeneralNotes(imported.generalNotes);
    if (imported.recommendedAuction) setAuctionInput(imported.recommendedAuction.join(' '));

    setActiveTab('visual');
  };

  // Validation & Save
  const handleSave = () => {
    setErrorMessage(null);

    // Check each hand has 13 cards
    const incompleteHands = (['N', 'E', 'S', 'W'] as Direction[]).filter(d => hands[d].length !== 13);
    if (incompleteHands.length > 0) {
      setErrorMessage(`Każda ręka musi mieć dokładnie 13 kart! Brakuje kart na pozycjach: ${incompleteHands.join(', ')}. Kliknij "Uzupełnij losowo brakujące", aby dokończyć rozdanie.`);
      return;
    }

    const cleanAuction = auctionInput.trim() ? auctionInput.split(/\s+/).filter(Boolean) : undefined;

    const newDeal: Deal = {
      id: initialDeal?.id || `deal-${Date.now()}`,
      title: title.trim() || 'Rozdanie szkoleniowe',
      category: category.trim() || 'Lekcje',
      difficulty,
      dealer,
      vulnerability,
      hands,
      description: teacherGoal || title,
      teacherGoal: teacherGoal.trim() || 'Praktyczne rozegranie rozdania według wskazówek instruktora.',
      generalNotes: generalNotes.trim() || undefined,
      recommendedAuction: cleanAuction,
      isUserCreated: true,
      createdAt: new Date().toISOString(),
    };

    onSaveDeal(newDeal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800/90 px-5 py-3 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              {initialDeal ? 'Edytor rozdania' : 'Kreator nowego rozdania szkoleniowego'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`pb-2.5 transition border-b-2 cursor-pointer ${
              activeTab === 'visual'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Wizualny selektor 52 kart
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pbn')}
            className={`pb-2.5 transition border-b-2 cursor-pointer ${
              activeTab === 'pbn'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Import / Tekst PBN
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Deal Metadata Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Tytuł rozdania</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Impas kierowy w 3BA"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Kategoria lekcji</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="np. Rozgrywka w bez atu"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Poziom trudności</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="Początkujący">Początkujący</option>
                <option value="Średniozaawansowany">Średniozaawansowany</option>
                <option value="Zaawansowany">Zaawansowany</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Rozdający (Dealer)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['N', 'E', 'S', 'W'] as Direction[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDealer(d)}
                    className={`py-1.5 rounded font-bold border transition cursor-pointer ${
                      dealer === d
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Założenia (Partia)</label>
              <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                {[
                  { id: 'None', label: 'Przed partią' },
                  { id: 'NS', label: 'Po partii NS' },
                  { id: 'EW', label: 'Po partii EW' },
                  { id: 'All', label: 'Obie po partii' },
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVulnerability(v.id as Vulnerability)}
                    className={`py-1.5 px-1 rounded font-bold border truncate transition cursor-pointer ${
                      vulnerability === v.id
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab 1: Visual Card Picker */}
          {activeTab === 'visual' && (
            <div className="space-y-4">
              {/* Hands allocation summary bar */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 font-semibold">Wybierz pozycję do rozdawania kart:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAutoCompleteRemaining}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition cursor-pointer text-[11px]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Uzupełnij brakujące losowo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRandomizeAll}
                      className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition cursor-pointer text-[11px]"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Rozdaj wszystko losowo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition cursor-pointer text-[11px]"
                    >
                      Wyczyść
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(['N', 'E', 'S', 'W'] as Direction[]).map(d => {
                    const count = hands[d].length;
                    const hcp = calculateHCP(hands[d]);
                    const isSelected = selectedSeat === d;

                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedSeat(d)}
                        className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/50'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 font-bold">
                          <span className={isSelected ? 'text-amber-300' : 'text-white'}>Ręka {d}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] ${count === 13 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                            {count}/13 kart
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>{hcp} PC</span>
                          <span className="font-mono text-[10px] truncate max-w-[80px]">
                            {formatPbnHand(hands[d]) || 'pusta'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 52 Cards Table sorted by suits */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="text-slate-400 text-[11px] mb-1">
                  Kliknij kartę, aby przypisać ją do aktualnie wybranej ręki ({selectedSeat}) lub kliknij ponownie, aby ją cofnąć:
                </div>

                {SUITS_ORDER.map(suit => {
                  const suitSymbol = suit === 'S' ? '♠' : suit === 'H' ? '♥' : suit === 'D' ? '♦' : '♣';
                  const suitColor = suit === 'H' ? 'text-red-500' : suit === 'D' ? 'text-amber-500' : suit === 'C' ? 'text-emerald-500' : 'text-slate-300';

                  return (
                    <div key={suit} className="flex items-center gap-1.5">
                      <span className={`w-6 h-6 flex items-center justify-center font-bold text-sm bg-slate-800 rounded shrink-0 ${suitColor}`}>
                        {suitSymbol}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {RANKS_ORDER.map(rank => {
                          const card = createCard(suit, rank);
                          const owner = cardAssignments.get(card.id);
                          const isAssignedToCurrent = owner === selectedSeat;
                          const displayRank = rank === 'T' ? '10' : rank;

                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => handleCardClick(card)}
                              className={`
                                w-8 h-8 rounded font-bold text-xs flex flex-col items-center justify-center border transition-all cursor-pointer
                                ${isAssignedToCurrent
                                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105 font-extrabold'
                                  : owner
                                  ? 'bg-slate-800 text-slate-400 border-slate-700 opacity-60'
                                  : 'bg-slate-700/60 hover:bg-slate-600 text-white border-slate-600'
                                }
                              `}
                              title={owner ? `Przypisana do ${owner}` : 'Wolna karta'}
                            >
                              <span>{displayRank}</span>
                              {owner && <span className="text-[9px] leading-none opacity-80">{owner}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: PBN Import */}
          {activeTab === 'pbn' && (
            <div className="space-y-3">
              <label className="block text-slate-300 font-semibold">
                Wklej zapis PBN (Portable Bridge Notation):
              </label>
              <textarea
                value={pbnRaw}
                onChange={(e) => setPbnRaw(e.target.value)}
                rows={7}
                placeholder={`% Wklej rozdanie z BBO lub PZBS:\n[Dealer "N"]\n[Vulnerable "None"]\n[Deal "N:AK.QJT.987.AKQJ 98.765.654.9876 ..."]\n[Auction "N"]\n1NT Pass 3NT Pass Pass Pass`}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                type="button"
                onClick={handleImportPbn}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Zaimportuj z PBN</span>
              </button>
            </div>
          )}

          {/* Pedagogical Notes Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Zalecana licytacja (odzywki oddzielone spacjami)
              </label>
              <input
                type="text"
                value={auctionInput}
                onChange={(e) => setAuctionInput(e.target.value)}
                placeholder="1NT Pass 2D Pass 2H Pass 4H Pass Pass Pass"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Cel dydaktyczny dla ucznia
              </label>
              <input
                type="text"
                value={teacherGoal}
                onChange={(e) => setTeacherGoal(e.target.value)}
                placeholder="np. Zrozumienie manewru impasu damy karo"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Szczegółowy komentarz instruktora / plan rozgrywki
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={2}
              placeholder="np. Wistuje West czwórką pik. Zwróć uwagę uczniów na to, że po wzięciu lewy asem należy natychmiast zagrać karo..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/90 px-5 py-3 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition cursor-pointer"
          >
            Anuluj
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-lg transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Zapisz rozdanie do lekcji</span>
          </button>
        </div>
      </div>
    </div>
  );
};
