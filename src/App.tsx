import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  Direction,
  Card,
  Contract,
  Trick,
  nextDirection,
  partnerOf,
  isLegalCardPlay,
  determineTrickWinner,
  evaluateAuction,
  calculateBridgeScore,
  isValidCall,
} from './logic/bridgeRules';
import { Deal, TableSettings } from './types/bridge';
import { PRESET_DEALS } from './data/presetDeals';
import { FeltTable } from './components/FeltTable';
import { BiddingBox } from './components/BiddingBox';
import { BiddingHistory } from './components/BiddingHistory';
import { TeacherPanel } from './components/TeacherPanel';
import { DealEditorModal } from './components/DealEditorModal';
import { DealsLibraryModal } from './components/DealsLibraryModal';
import {
  BookOpen,
  PlusCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  Trophy,
  HelpCircle,
  Volume2,
  VolumeX,
  Compass,
  Layers,
  FileSpreadsheet,
  GraduationCap,
  LayoutGrid,
  Move,
} from 'lucide-react';
import { WorkspaceWindow } from './components/WorkspaceWindow';
import { WorkspaceDock } from './components/WorkspaceDock';
import {
  WindowState,
  getDefaultWindowsLayout,
  bringWindowToFront,
  toggleWindowMinimize,
  toggleWindowMaximize,
  setWindowOpen,
} from './logic/windowManager';

const LOCAL_STORAGE_CUSTOM_DEALS = 'bridge_master_custom_deals_v1';
const LOCAL_STORAGE_WINDOWS_KEY = 'bridge_master_windows_layout_v3';
const LOCAL_STORAGE_FLOATING_KEY = 'bridge_master_floating_mode_v3';
const TRICK_TAKE_PAUSE_MS = 1000;

export default function App() {
  // Custom deals from localStorage
  const [customDeals, setCustomDeals] = useState<Deal[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_DEALS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allDeals = useMemo(() => [...PRESET_DEALS, ...customDeals], [customDeals]);

  // Active Deal
  const [currentDeal, setCurrentDeal] = useState<Deal>(PRESET_DEALS[0]);

  // Settings
  const [settings, setSettings] = useState<TableSettings>({
    fourColorDeck: false, // classic BBO 2-color matching reference screenshot
    openCards: false, // student mode by default
    autoPlaySingletons: true,
    fastTrickAnimation: false,
    soundEnabled: true,
    userSeat: 'S',
  });
  const trickTakeDurationMs = settings.fastTrickAnimation ? 650 : 900;

  // Presentation mode: Manual control of all seats vs AI/Robot opponents
  const [manualControl, setManualControl] = useState<boolean>(false);

  // Modals
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Workspace container ref for boundary calculations
  const workspaceContainerRef = useRef<HTMLDivElement>(null);

  // Floating movable windows mode vs Tiled Grid mode
  const [isFloatingMode, setIsFloatingMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FLOATING_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Windows layout state
  const [windows, setWindows] = useState<Record<string, WindowState>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_WINDOWS_KEY);
      if (saved) {
        const savedWindows: Record<string, WindowState> = JSON.parse(saved);
        const tableWindow = savedWindows.table;
        if (tableWindow) {
          savedWindows.table = {
            ...tableWindow,
            title: tableWindow.title.replace(/\s*\(BBO Felt\)\s*$/i, ''),
          };
        }
        return savedWindows;
      }
    } catch {}
    return getDefaultWindowsLayout(typeof window !== 'undefined' ? window.innerWidth : 1440, 900);
  });

  // Window Manager Handlers
  const handleUpdateWindowState = useCallback((id: string, partial: Partial<WindowState>) => {
    setWindows(prev => {
      const next = { ...prev, [id]: { ...prev[id], ...partial } };
      try {
        localStorage.setItem(LOCAL_STORAGE_WINDOWS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleBringToFront = useCallback((id: string) => {
    setWindows(prev => {
      const next = bringWindowToFront(prev, id);
      try {
        localStorage.setItem(LOCAL_STORAGE_WINDOWS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleToggleMinimize = useCallback((id: string) => {
    setWindows(prev => {
      const next = toggleWindowMinimize(prev, id);
      try {
        localStorage.setItem(LOCAL_STORAGE_WINDOWS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleToggleMaximize = useCallback((id: string) => {
    setWindows(prev => {
      const cW = workspaceContainerRef.current?.clientWidth || window.innerWidth;
      const cH = workspaceContainerRef.current?.clientHeight || window.innerHeight;
      const next = toggleWindowMaximize(prev, id, cW, cH);
      try {
        localStorage.setItem(LOCAL_STORAGE_WINDOWS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleCloseWindow = useCallback((id: string) => {
    setWindows(prev => {
      const next = setWindowOpen(prev, id, false);
      try {
        localStorage.setItem(LOCAL_STORAGE_WINDOWS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleToggleOpenWindow = useCallback((id: string) => {
    setWindows(prev => {
      const target = prev[id];
      const nextOpen = target ? !target.isOpen : true;
      const next = setWindowOpen(prev, id, nextOpen);
      try {
        localStorage.setItem(LOCAL_STORAGE_WINDOWS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleResetLayout = useCallback(() => {
    const cW = workspaceContainerRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1440);
    const cH = workspaceContainerRef.current?.clientHeight || 900;
    const def = getDefaultWindowsLayout(cW, cH);
    setWindows(def);
    try {
      localStorage.setItem(LOCAL_STORAGE_WINDOWS_KEY, JSON.stringify(def));
    } catch {}
  }, []);

  const handleToggleFloatingMode = useCallback(() => {
    setIsFloatingMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem(LOCAL_STORAGE_FLOATING_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleMinimizeAll = useCallback(() => {
    setWindows(prev => {
      const next: Record<string, WindowState> = {};
      Object.keys(prev).forEach(k => {
        next[k] = { ...prev[k], isMinimized: true };
      });
      return next;
    });
  }, []);

  const handleRestoreAll = useCallback(() => {
    setWindows(prev => {
      const next: Record<string, WindowState> = {};
      Object.keys(prev).forEach(k => {
        next[k] = { ...prev[k], isMinimized: false, isOpen: true };
      });
      return next;
    });
  }, []);

  // Phase: 'bidding' | 'play' | 'finished'
  const [phase, setPhase] = useState<'bidding' | 'play' | 'finished'>('bidding');

  // Bidding state
  const [biddingHistory, setBiddingHistory] = useState<{ call: string; by: Direction; explanation?: string }[]>([]);
  const [biddingTurn, setBiddingTurn] = useState<Direction>(currentDeal.dealer);
  const [contract, setContract] = useState<Contract | null>(null);

  // Play state
  const [hands, setHands] = useState<Record<Direction, Card[]>>({
    N: [...currentDeal.hands.N],
    E: [...currentDeal.hands.E],
    S: [...currentDeal.hands.S],
    W: [...currentDeal.hands.W],
  });

  const [completedTricks, setCompletedTricks] = useState<Trick[]>([]);
  const [currentTrick, setCurrentTrick] = useState<Trick>({
    cards: [],
    leader: 'W', // will be set when auction completes
    trumpSuit: null,
  });
  const [playTurn, setPlayTurn] = useState<Direction>('W');
  const [waitingForNextTrick, setWaitingForNextTrick] = useState<boolean>(false);
  const [lastTrickWinner, setLastTrickWinner] = useState<Direction | null>(null);
  const [isCollectingTrick, setIsCollectingTrick] = useState<boolean>(false);

  // Score modal
  const [scoreResult, setScoreResult] = useState<ReturnType<typeof calculateBridgeScore> | null>(null);

  // Undo history snapshot stack
  const [historyStack, setHistoryStack] = useState<{
    phase: 'bidding' | 'play' | 'finished';
    biddingHistory: typeof biddingHistory;
    biddingTurn: Direction;
    contract: Contract | null;
    hands: Record<Direction, Card[]>;
    completedTricks: Trick[];
    currentTrick: Trick;
    playTurn: Direction;
    waitingForNextTrick: boolean;
    lastTrickWinner: Direction | null;
  }[]>([]);

  // Update Settings helper
  const handleUpdateSettings = (partial: Partial<TableSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  // Reset / load deal
  const loadDeal = useCallback((deal: Deal) => {
    setCurrentDeal(deal);
    setPhase('bidding');
    setBiddingHistory([]);
    setBiddingTurn(deal.dealer);
    setContract(null);
    setHands({
      N: [...deal.hands.N],
      E: [...deal.hands.E],
      S: [...deal.hands.S],
      W: [...deal.hands.W],
    });
    setCompletedTricks([]);
    setCurrentTrick({
      cards: [],
      leader: nextDirection(deal.dealer),
      trumpSuit: null,
    });
    setPlayTurn(nextDirection(deal.dealer));
    setWaitingForNextTrick(false);
    setLastTrickWinner(null);
    setIsCollectingTrick(false);
    setScoreResult(null);
    setHistoryStack([]);
  }, []);

  // Save state for Undo
  const pushHistorySnapshot = useCallback(() => {
    setHistoryStack(prev => [
      ...prev,
      {
        phase,
        biddingHistory: [...biddingHistory],
        biddingTurn,
        contract,
        hands: {
          N: [...hands.N],
          E: [...hands.E],
          S: [...hands.S],
          W: [...hands.W],
        },
        completedTricks: [...completedTricks],
        currentTrick: { ...currentTrick, cards: [...currentTrick.cards] },
        playTurn,
        waitingForNextTrick,
        lastTrickWinner,
      },
    ]);
  }, [
    phase,
    biddingHistory,
    biddingTurn,
    contract,
    hands,
    completedTricks,
    currentTrick,
    playTurn,
    waitingForNextTrick,
    lastTrickWinner,
  ]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, prev.length - 1));

    setPhase(last.phase);
    setBiddingHistory(last.biddingHistory);
    setBiddingTurn(last.biddingTurn);
    setContract(last.contract);
    setHands(last.hands);
    setCompletedTricks(last.completedTricks);
    setCurrentTrick(last.currentTrick);
    setPlayTurn(last.playTurn);
    setWaitingForNextTrick(last.waitingForNextTrick);
    setLastTrickWinner(last.lastTrickWinner);
    setIsCollectingTrick(false);
    setScoreResult(null);
  }, [historyStack]);

  // Save custom deal
  const handleSaveDeal = (newDeal: Deal) => {
    const updated = [newDeal, ...customDeals.filter(d => d.id !== newDeal.id)];
    setCustomDeals(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_DEALS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    loadDeal(newDeal);
  };

  // Delete custom deal
  const handleDeleteDeal = (dealId: string) => {
    const updated = customDeals.filter(d => d.id !== dealId);
    setCustomDeals(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_DEALS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (currentDeal.id === dealId) {
      loadDeal(PRESET_DEALS[0]);
    }
  };

  // Calculate NS & EW won tricks
  const nsTricksWon = useMemo(() => {
    return completedTricks.filter(t => t.winner === 'N' || t.winner === 'S').length;
  }, [completedTricks]);

  const ewTricksWon = useMemo(() => {
    return completedTricks.filter(t => t.winner === 'E' || t.winner === 'W').length;
  }, [completedTricks]);

  // Card play legality for current player
  const currentHand = hands[playTurn] || [];
  const playableCardIds = useMemo(() => {
    const set = new Set<string>();
    if (phase !== 'play' || waitingForNextTrick) return set;
    currentHand.forEach(card => {
      if (isLegalCardPlay(card, currentHand, currentTrick)) {
        set.add(card.id);
      }
    });
    return set;
  }, [phase, waitingForNextTrick, currentHand, currentTrick]);
  const isHumanControlledTurn =
    manualControl ||
    playTurn === settings.userSeat ||
    Boolean(contract && contract.declarer === settings.userSeat && playTurn === contract.dummy);

  // Start card play after auction
  const startCardPlay = useCallback((finalContract: Contract) => {
    setContract(finalContract);
    setPhase('play');

    // Opening leader is left-hand opponent of declarer
    const leader = nextDirection(finalContract.declarer);
    const trump = finalContract.strain === 'NT' ? null : (finalContract.strain as any);

    setCurrentTrick({
      cards: [],
      leader,
      trumpSuit: trump,
    });
    setPlayTurn(leader);
    setIsCollectingTrick(false);
  }, []);

  // Handle Bidding Call
  const handleMakeCall = useCallback((call: string, explanation?: string) => {
    if (phase !== 'bidding') return;
    pushHistorySnapshot();

    const newHistory = [...biddingHistory, { call, by: biddingTurn, explanation }];
    setBiddingHistory(newHistory);

    const evaluated = evaluateAuction(currentDeal.dealer, newHistory, currentDeal.vulnerability);

    if (evaluated.isPassedOut) {
      alert('Wszyscy spasowali – rozdanie bez gry (Pas po 4 pasach).');
      loadDeal(currentDeal);
      return;
    }

    if (evaluated.isAuctionFinished && evaluated.contract) {
      startCardPlay(evaluated.contract);
    } else {
      setBiddingTurn(nextDirection(biddingTurn));
    }
  }, [phase, pushHistorySnapshot, biddingHistory, biddingTurn, currentDeal, loadDeal, startCardPlay]);

  // Handle Play of a Card
  const handlePlayCard = useCallback((card: Card, playedBy: Direction) => {
    if (phase !== 'play' || waitingForNextTrick) return;
    if (playedBy !== playTurn) return;

    const hand = hands[playedBy];
    if (!isLegalCardPlay(card, hand, currentTrick)) return;

    pushHistorySnapshot();

    // Remove card from player hand
    setHands(prev => ({
      ...prev,
      [playedBy]: prev[playedBy].filter(c => c.id !== card.id),
    }));

    const newCards = [...currentTrick.cards, { card, playedBy }];
    const updatedTrick = { ...currentTrick, cards: newCards };
    setCurrentTrick(updatedTrick);

    // If trick complete (4 cards)
    if (newCards.length === 4) {
      setIsCollectingTrick(false);
      const winner = determineTrickWinner(updatedTrick);
      const finishedTrick: Trick = { ...updatedTrick, winner };
      setLastTrickWinner(winner);
      setWaitingForNextTrick(true);

      const nextCompleted = [...completedTricks, finishedTrick];
      setCompletedTricks(nextCompleted);

      // Check if all 13 tricks played
      if (nextCompleted.length === 13 && contract) {
        const declarerWon = contract.declarer === 'N' || contract.declarer === 'S'
          ? nextCompleted.filter(t => t.winner === 'N' || t.winner === 'S').length
          : nextCompleted.filter(t => t.winner === 'E' || t.winner === 'W').length;

        const score = calculateBridgeScore(contract, declarerWon);
        setScoreResult(score);

        if (score.isMade) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    } else {
      setPlayTurn(nextDirection(playedBy));
    }
  }, [phase, waitingForNextTrick, playTurn, hands, currentTrick, pushHistorySnapshot, completedTricks, contract]);

  // Proceed to next trick
  const handleNextTrick = useCallback(() => {
    if (!lastTrickWinner) return;
    const trump = contract?.strain === 'NT' ? null : (contract?.strain as any);
    setCurrentTrick({
      cards: [],
      leader: lastTrickWinner,
      trumpSuit: trump,
    });
    setPlayTurn(lastTrickWinner);
    setWaitingForNextTrick(false);
    setIsCollectingTrick(false);
  }, [lastTrickWinner, contract]);

  useEffect(() => {
    if (!waitingForNextTrick) {
      setIsCollectingTrick(false);
      return;
    }

    const timer = setTimeout(() => setIsCollectingTrick(true), TRICK_TAKE_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [waitingForNextTrick]);

  // Collect the completed trick before starting the next one.
  useEffect(() => {
    if (waitingForNextTrick) {
      const timer = setTimeout(() => {
        if (completedTricks.length === 13) {
          setPhase('finished');
        } else {
          handleNextTrick();
        }
      }, TRICK_TAKE_PAUSE_MS + trickTakeDurationMs + 150);
      return () => clearTimeout(timer);
    }
  }, [waitingForNextTrick, completedTricks.length, trickTakeDurationMs, handleNextTrick]);

  // Claim tricks
  const handleClaimTricks = (claimedByNS: number) => {
    if (phase !== 'play' || !contract) return;
    pushHistorySnapshot();

    const declarerSide = (contract.declarer === 'N' || contract.declarer === 'S') ? 'NS' : 'EW';
    const totalNS = nsTricksWon + claimedByNS;
    const totalDeclarer = declarerSide === 'NS' ? totalNS : (13 - totalNS);

    setPhase('finished');
    const score = calculateBridgeScore(contract, totalDeclarer);
    setScoreResult(score);

    if (score.isMade) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  // AI / Robot automation for non-human turns when manualControl is false
  useEffect(() => {
    if (manualControl) return;

    // Automated Bidding assistance if following recommended auction
    if (phase === 'bidding') {
      const isUserTurn = biddingTurn === settings.userSeat;
      if (!isUserTurn && currentDeal.recommendedAuction) {
        const nextIdx = biddingHistory.length;
        if (nextIdx < currentDeal.recommendedAuction.length) {
          const call = currentDeal.recommendedAuction[nextIdx];
          const timer = setTimeout(() => {
            handleMakeCall(call, currentDeal.auctionNotes?.[nextIdx]);
          }, 600);
          return () => clearTimeout(timer);
        }
      }
    }

    // Automated Card Play
    if (phase === 'play' && !waitingForNextTrick) {
      if (!isHumanControlledTurn) {
        const hand = hands[playTurn];
        if (!hand || hand.length === 0) return;

        // Choose legal card: prefer lowest legal card or honor if leader
        const legalCards = hand.filter(c => isLegalCardPlay(c, hand, currentTrick));
        if (legalCards.length > 0) {
          // Play a card after natural brief delay
          const timer = setTimeout(() => {
            const cardToPlay = legalCards[0];
            handlePlayCard(cardToPlay, playTurn);
          }, 650);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [
    manualControl,
    phase,
    biddingTurn,
    settings.userSeat,
    currentDeal,
    biddingHistory.length,
    handleMakeCall,
    playTurn,
    waitingForNextTrick,
    contract,
    hands,
    currentTrick,
    handlePlayCard,
    isHumanControlledTurn,
  ]);

  // Current trick index (1..13)
  const currentTrickIndex = completedTricks.length + 1;
  const activeTrickNote = currentDeal.tricksNotes?.[currentTrickIndex];

  // Recommended next bidding call
  const recommendedNextCall = currentDeal.recommendedAuction?.[biddingHistory.length];
  const recommendedExplanation = currentDeal.auctionNotes?.[biddingHistory.length];

  // Fullscreen toggle handler
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header & Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center font-bold text-white shadow-lg text-lg border border-emerald-500/50">
            ♠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-tight text-white">Bridge Master</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Edycja treningowa
              </span>
            </div>
            <p className="text-xs text-slate-400">Studio Nauki i Prowadzenia Lekcji Brydża</p>
          </div>
        </div>

        {/* Header Center: Deal Title and Selector */}
        <div className="hidden lg:flex items-center gap-2.5 bg-slate-800/90 px-4 py-2 rounded-xl border border-slate-700 shadow-sm">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-slate-400 font-medium">Lekcja:</span>
          <span className="text-sm font-bold text-amber-300 truncate max-w-sm">{currentDeal.title}</span>
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 ml-1.5 underline cursor-pointer"
          >
            Zmień
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Fullscreen toggle button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Włącz tryb pełnego ekranu"
          >
            <span>{isFullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'}</span>
          </button>

          {/* Quick Teacher View Mode toggle */}
          <button
            type="button"
            onClick={() => handleUpdateSettings({ openCards: !settings.openCards })}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold border transition cursor-pointer ${
              settings.openCards
                ? 'bg-blue-600/40 border-blue-400 text-blue-100 shadow'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Przełącz widok kart: Widok Nauczyciela (wszystkie karty jawne) vs Widok Ucznia (karty przeciwników zakryte)"
          >
            {settings.openCards ? <Eye className="w-4 h-4 text-blue-300" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{settings.openCards ? 'Widok Trenera (Jawne)' : 'Widok Ucznia'}</span>
          </button>

          {/* Mode Switcher: Floating Windows vs Tiled Grid */}
          <button
            type="button"
            onClick={handleToggleFloatingMode}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isFloatingMode
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Przełącz tryb: Swobodne okna (przesuwanie i zmiana rozmiaru) vs Siatka"
          >
            {isFloatingMode ? <Move className="w-4 h-4 text-amber-400" /> : <LayoutGrid className="w-4 h-4 text-slate-400" />}
            <span>{isFloatingMode ? 'Układ: Swobodne okna' : 'Układ: Siatka'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingDeal(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs md:text-sm shadow-lg transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Nowe rozdanie</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area: Supports both Free-Floating Movable Mode and Tiled Grid Mode */}
      <main
        ref={workspaceContainerRef}
        className={`flex-1 w-full p-3 sm:p-5 relative ${
          isFloatingMode ? 'min-h-[1100px] overflow-auto' : 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start'
        }`}
      >
        {isFloatingMode ? (
          // ================= FREE-FLOATING MOVABLE / RESIZABLE WORKSPACE =================
          <>
            {/* Window 1: Table */}
            <WorkspaceWindow
              windowState={windows.table}
              onUpdateState={(partial) => handleUpdateWindowState('table', partial)}
              onBringToFront={() => handleBringToFront('table')}
              onClose={() => handleCloseWindow('table')}
              onToggleMinimize={() => handleToggleMinimize('table')}
              onToggleMaximize={() => handleToggleMaximize('table')}
              containerRef={workspaceContainerRef}
              isFloatingMode={isFloatingMode}
              icon={<Compass className="w-4 h-4 text-emerald-400" />}
              badge={
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                  Stół
                </span>
              }
            >
              <FeltTable
                hands={hands}
                biddingHistory={biddingHistory}
                currentTurn={phase === 'bidding' ? biddingTurn : playTurn}
                dealer={currentDeal.dealer}
                vulnerability={currentDeal.vulnerability}
                contract={contract}
                currentTrick={currentTrick}
                nsTricksWon={nsTricksWon}
                ewTricksWon={ewTricksWon}
                openCards={settings.openCards}
                fourColor={settings.fourColorDeck}
                userSeat={settings.userSeat}
                isInteractive={phase === 'play' && isHumanControlledTurn}
                playableCardIds={playableCardIds}
                onPlayCard={handlePlayCard}
                waitingForNextTrick={waitingForNextTrick}
                lastTrickWinner={lastTrickWinner}
                isCollectingTrick={isCollectingTrick}
                trickTakeDurationMs={trickTakeDurationMs}
              />
            </WorkspaceWindow>

            {/* Window 2: Bidding Box / Tricks Status */}
            <WorkspaceWindow
              windowState={windows.biddingBox}
              onUpdateState={(partial) => handleUpdateWindowState('biddingBox', partial)}
              onBringToFront={() => handleBringToFront('biddingBox')}
              onClose={() => handleCloseWindow('biddingBox')}
              onToggleMinimize={() => handleToggleMinimize('biddingBox')}
              onToggleMaximize={() => handleToggleMaximize('biddingBox')}
              containerRef={workspaceContainerRef}
              isFloatingMode={isFloatingMode}
              icon={<Layers className="w-4 h-4 text-amber-400" />}
              badge={
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/30">
                  {phase === 'bidding' ? 'Licytacja' : 'Rozgrywka'}
                </span>
              }
            >
              {phase === 'bidding' ? (
                <BiddingBox
                  onMakeCall={handleMakeCall}
                  history={biddingHistory}
                  currentTurn={biddingTurn}
                  recommendedNextCall={recommendedNextCall}
                  recommendedExplanation={recommendedExplanation}
                  disabled={!manualControl && biddingTurn !== settings.userSeat}
                />
              ) : (
                <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-4 text-white shadow-xl w-full flex-1">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs md:text-sm">
                    <span className="font-extrabold text-slate-200 text-sm">Stan lew w rozgrywce</span>
                    <span className="text-amber-400 font-mono font-bold text-sm">Lewa {currentTrickIndex}/13</span>
                  </div>

                  <div className="space-y-3 text-xs md:text-sm">
                    <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-slate-300 font-medium">Wymagane przez kontrakt:</span>
                      <strong className="text-amber-300 text-base font-mono">
                        {contract ? 6 + contract.level : 0} lew
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-blue-950/70 border border-blue-500/40 p-3 rounded-xl shadow">
                        <div className="text-xs text-blue-300 font-bold mb-1">Zdobyte przez NS</div>
                        <div className="text-2xl font-black text-blue-200 font-mono">{nsTricksWon}</div>
                      </div>
                      <div className="bg-rose-950/70 border border-rose-500/40 p-3 rounded-xl shadow">
                        <div className="text-xs text-rose-300 font-bold mb-1">Zdobyte przez EW</div>
                        <div className="text-2xl font-black text-rose-200 font-mono">{ewTricksWon}</div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </WorkspaceWindow>

            {/* Window 3: Bidding History */}
            <WorkspaceWindow
              windowState={windows.biddingHistory}
              onUpdateState={(partial) => handleUpdateWindowState('biddingHistory', partial)}
              onBringToFront={() => handleBringToFront('biddingHistory')}
              onClose={() => handleCloseWindow('biddingHistory')}
              onToggleMinimize={() => handleToggleMinimize('biddingHistory')}
              onToggleMaximize={() => handleToggleMaximize('biddingHistory')}
              containerRef={workspaceContainerRef}
              isFloatingMode={isFloatingMode}
              icon={<FileSpreadsheet className="w-4 h-4 text-blue-400" />}
              badge={
                <span className="text-[10px] font-mono text-blue-300 bg-blue-950/70 px-2 py-0.5 rounded border border-blue-500/30">
                  {biddingHistory.length} odzywek
                </span>
              }
            >
              <BiddingHistory
                dealer={currentDeal.dealer}
                vulnerability={currentDeal.vulnerability}
                history={biddingHistory}
                contract={contract}
                fourColor={settings.fourColorDeck}
              />
            </WorkspaceWindow>

            {/* Window 4: Teacher Panel */}
            <WorkspaceWindow
              windowState={windows.teacherPanel}
              onUpdateState={(partial) => handleUpdateWindowState('teacherPanel', partial)}
              onBringToFront={() => handleBringToFront('teacherPanel')}
              onClose={() => handleCloseWindow('teacherPanel')}
              onToggleMinimize={() => handleToggleMinimize('teacherPanel')}
              onToggleMaximize={() => handleToggleMaximize('teacherPanel')}
              containerRef={workspaceContainerRef}
              isFloatingMode={isFloatingMode}
              icon={<GraduationCap className="w-4 h-4 text-purple-400" />}
              badge={
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                  Instruktor
                </span>
              }
            >
              <TeacherPanel
                deal={currentDeal}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                contract={contract}
                nsTricksWon={nsTricksWon}
                ewTricksWon={ewTricksWon}
                currentTrickIndex={currentTrickIndex}
                activeTrickNote={activeTrickNote}
                onUndo={handleUndo}
                onRestart={() => loadDeal(currentDeal)}
                onClaimTricks={handleClaimTricks}
                onOpenLibrary={() => setIsLibraryOpen(true)}
                onOpenCreator={() => {
                  setEditingDeal(null);
                  setIsEditorOpen(true);
                }}
                isBiddingPhase={phase === 'bidding'}
                manualControl={manualControl}
                onToggleManualControl={() => setManualControl(!manualControl)}
              />
            </WorkspaceWindow>
          </>
        ) : (
          // ================= TILED GRID MODE =================
          <>
            {/* Left 8 cols: Table + Bottom 2 Boxes */}
            <div className="xl:col-span-8 flex flex-col items-center gap-5 w-full">
              {windows.table.isOpen && (
                <WorkspaceWindow
                  windowState={windows.table}
                  onUpdateState={(partial) => handleUpdateWindowState('table', partial)}
                  onBringToFront={() => handleBringToFront('table')}
                  onClose={() => handleCloseWindow('table')}
                  onToggleMinimize={() => handleToggleMinimize('table')}
                  onToggleMaximize={() => handleToggleMaximize('table')}
                  containerRef={workspaceContainerRef}
                  isFloatingMode={isFloatingMode}
                  icon={<Compass className="w-4 h-4 text-emerald-400" />}
                >
                  <FeltTable
                    hands={hands}
                    biddingHistory={biddingHistory}
                    currentTurn={phase === 'bidding' ? biddingTurn : playTurn}
                    dealer={currentDeal.dealer}
                    vulnerability={currentDeal.vulnerability}
                    contract={contract}
                    currentTrick={currentTrick}
                    nsTricksWon={nsTricksWon}
                    ewTricksWon={ewTricksWon}
                    openCards={settings.openCards}
                    fourColor={settings.fourColorDeck}
                    userSeat={settings.userSeat}
                    isInteractive={phase === 'play' && isHumanControlledTurn}
                    playableCardIds={playableCardIds}
                    onPlayCard={handlePlayCard}
                    waitingForNextTrick={waitingForNextTrick}
                    lastTrickWinner={lastTrickWinner}
                    isCollectingTrick={isCollectingTrick}
                    trickTakeDurationMs={trickTakeDurationMs}
                  />
                </WorkspaceWindow>
              )}

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {windows.biddingBox.isOpen && (
                  <WorkspaceWindow
                    windowState={windows.biddingBox}
                    onUpdateState={(partial) => handleUpdateWindowState('biddingBox', partial)}
                    onBringToFront={() => handleBringToFront('biddingBox')}
                    onClose={() => handleCloseWindow('biddingBox')}
                    onToggleMinimize={() => handleToggleMinimize('biddingBox')}
                    onToggleMaximize={() => handleToggleMaximize('biddingBox')}
                    containerRef={workspaceContainerRef}
                    isFloatingMode={isFloatingMode}
                    icon={<Layers className="w-4 h-4 text-amber-400" />}
                  >
                    {phase === 'bidding' ? (
                      <BiddingBox
                        onMakeCall={handleMakeCall}
                        history={biddingHistory}
                        currentTurn={biddingTurn}
                        recommendedNextCall={recommendedNextCall}
                        recommendedExplanation={recommendedExplanation}
                        disabled={!manualControl && biddingTurn !== settings.userSeat}
                      />
                    ) : (
                      <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-4 text-white shadow-xl w-full">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs md:text-sm">
                          <span className="font-extrabold text-slate-200 text-sm">Stan lew w rozgrywce</span>
                          <span className="text-amber-400 font-mono font-bold text-sm">Lewa {currentTrickIndex}/13</span>
                        </div>

                        <div className="space-y-3 text-xs md:text-sm">
                          <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                            <span className="text-slate-300 font-medium">Wymagane przez kontrakt:</span>
                            <strong className="text-amber-300 text-base font-mono">
                              {contract ? 6 + contract.level : 0} lew
                            </strong>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-center">
                            <div className="bg-blue-950/70 border border-blue-500/40 p-3 rounded-xl shadow">
                              <div className="text-xs text-blue-300 font-bold mb-1">Zdobyte przez NS</div>
                              <div className="text-2xl font-black text-blue-200 font-mono">{nsTricksWon}</div>
                            </div>
                            <div className="bg-rose-950/70 border border-rose-500/40 p-3 rounded-xl shadow">
                              <div className="text-xs text-rose-300 font-bold mb-1">Zdobyte przez EW</div>
                              <div className="text-2xl font-black text-rose-200 font-mono">{ewTricksWon}</div>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                  </WorkspaceWindow>
                )}

                {windows.biddingHistory.isOpen && (
                  <WorkspaceWindow
                    windowState={windows.biddingHistory}
                    onUpdateState={(partial) => handleUpdateWindowState('biddingHistory', partial)}
                    onBringToFront={() => handleBringToFront('biddingHistory')}
                    onClose={() => handleCloseWindow('biddingHistory')}
                    onToggleMinimize={() => handleToggleMinimize('biddingHistory')}
                    onToggleMaximize={() => handleToggleMaximize('biddingHistory')}
                    containerRef={workspaceContainerRef}
                    isFloatingMode={isFloatingMode}
                    icon={<FileSpreadsheet className="w-4 h-4 text-blue-400" />}
                  >
                    <BiddingHistory
                      dealer={currentDeal.dealer}
                      vulnerability={currentDeal.vulnerability}
                      history={biddingHistory}
                      contract={contract}
                      fourColor={settings.fourColorDeck}
                    />
                  </WorkspaceWindow>
                )}
              </div>
            </div>

            {/* Right 4 cols: Teacher Panel */}
            <div className="xl:col-span-4 w-full sticky top-20">
              {windows.teacherPanel.isOpen && (
                <WorkspaceWindow
                  windowState={windows.teacherPanel}
                  onUpdateState={(partial) => handleUpdateWindowState('teacherPanel', partial)}
                  onBringToFront={() => handleBringToFront('teacherPanel')}
                  onClose={() => handleCloseWindow('teacherPanel')}
                  onToggleMinimize={() => handleToggleMinimize('teacherPanel')}
                  onToggleMaximize={() => handleToggleMaximize('teacherPanel')}
                  containerRef={workspaceContainerRef}
                  isFloatingMode={isFloatingMode}
                  icon={<GraduationCap className="w-4 h-4 text-purple-400" />}
                >
                  <TeacherPanel
                    deal={currentDeal}
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    contract={contract}
                    nsTricksWon={nsTricksWon}
                    ewTricksWon={ewTricksWon}
                    currentTrickIndex={currentTrickIndex}
                    activeTrickNote={activeTrickNote}
                    onUndo={handleUndo}
                    onRestart={() => loadDeal(currentDeal)}
                    onClaimTricks={handleClaimTricks}
                    onOpenLibrary={() => setIsLibraryOpen(true)}
                    onOpenCreator={() => {
                      setEditingDeal(null);
                      setIsEditorOpen(true);
                    }}
                    isBiddingPhase={phase === 'bidding'}
                    manualControl={manualControl}
                    onToggleManualControl={() => setManualControl(!manualControl)}
                  />
                </WorkspaceWindow>
              )}
            </div>
          </>
        )}
      </main>

      {/* Persistent Bottom Dock / Taskbar for Window Management */}
      <WorkspaceDock
        windows={windows}
        onToggleOpen={handleToggleOpenWindow}
        onBringToFront={handleBringToFront}
        isFloatingMode={isFloatingMode}
        onToggleFloatingMode={handleToggleFloatingMode}
        onResetLayout={handleResetLayout}
        onMinimizeAll={handleMinimizeAll}
        onRestoreAll={handleRestoreAll}
      />

      {/* Results / Score Modal */}
      {phase === 'finished' && scoreResult && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-amber-400/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center text-white animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <h3 className="text-xl font-extrabold text-white mb-1">
              {scoreResult.isMade ? 'Kontrakt zrealizowany!' : 'Wpadka bez gry'}
            </h3>

            <p className="text-xs text-slate-300 mb-4">
              {currentDeal.title} • {contract?.level}{contract?.strain === 'NT' ? 'BA' : contract?.strain} przez {contract?.declarer}
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Wynik lew:</span>
                <span className="font-bold text-white font-mono">
                  {contract?.declarer === 'N' || contract?.declarer === 'S' ? nsTricksWon : ewTricksWon} / {contract ? 6 + contract.level : 0} lew
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Bilans nadróbek / wpadek:</span>
                <span className={`font-bold font-mono ${scoreResult.isMade ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {scoreResult.resultString}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-sm font-extrabold">
                <span className="text-amber-300">Zapis brydżowy (score):</span>
                <span className={`font-mono text-base ${scoreResult.score >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {scoreResult.score > 0 ? `+${scoreResult.score}` : scoreResult.score} pkt
                </span>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => loadDeal(currentDeal)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition cursor-pointer"
              >
                Zagraj ponownie
              </button>

              <button
                type="button"
                onClick={() => {
                  setScoreResult(null);
                  setIsLibraryOpen(true);
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg transition cursor-pointer"
              >
                Kolejna lekcja →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modals */}
      <DealsLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        deals={allDeals}
        activeDealId={currentDeal.id}
        onSelectDeal={loadDeal}
        onEditDeal={(deal) => {
          setEditingDeal(deal);
          setIsEditorOpen(true);
        }}
        onDeleteDeal={handleDeleteDeal}
        onOpenCreator={() => {
          setEditingDeal(null);
          setIsEditorOpen(true);
        }}
      />

      <DealEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaveDeal={handleSaveDeal}
        initialDeal={editingDeal}
      />
    </div>
  );
}
