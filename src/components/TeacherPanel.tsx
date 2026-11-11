import React, { useState } from 'react';
import { Deal, TableSettings } from '../types/bridge';
import { Contract, calculateBridgeScore } from '../logic/bridgeRules';
import { exportToPbn } from '../utils/pbnParser';
import { BookOpen, Eye, EyeOff, RotateCcw, Award, Sparkles, Sliders, Share2, PlusCircle, CheckCircle2 } from 'lucide-react';

interface TeacherPanelProps {
  deal: Deal;
  settings: TableSettings;
  onUpdateSettings: (newSettings: Partial<TableSettings>) => void;
  contract: Contract | null;
  nsTricksWon: number;
  ewTricksWon: number;
  currentTrickIndex: number;
  activeTrickNote?: string;
  onUndo: () => void;
  onRestart: () => void;
  onClaimTricks: (claimedByNS: number) => void;
  onOpenLibrary: () => void;
  onOpenCreator: () => void;
  isBiddingPhase: boolean;
  manualControl: boolean;
  onToggleManualControl: () => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  deal,
  settings,
  onUpdateSettings,
  contract,
  nsTricksWon,
  ewTricksWon,
  currentTrickIndex,
  activeTrickNote,
  onUndo,
  onRestart,
  onClaimTricks,
  onOpenLibrary,
  onOpenCreator,
  isBiddingPhase,
  manualControl,
  onToggleManualControl,
}) => {
  const [copiedPbn, setCopiedPbn] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimCount, setClaimCount] = useState<number>(0);

  const handleCopyPbn = () => {
    const pbnText = exportToPbn(deal);
    navigator.clipboard.writeText(pbnText).then(() => {
      setCopiedPbn(true);
      setTimeout(() => setCopiedPbn(false), 2000);
    });
  };

  const remainingTricks = 13 - (nsTricksWon + ewTricksWon);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl text-white flex flex-col gap-4">
      {/* Deal Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-900/70 text-blue-300 border border-blue-700/50">
              {deal.category}
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${
              deal.difficulty === 'Początkujący'
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                : deal.difficulty === 'Średniozaawansowany'
                ? 'bg-amber-950/70 text-amber-300 border-amber-700/50'
                : 'bg-rose-950/70 text-rose-300 border-rose-700/50'
            }`}>
              {deal.difficulty}
            </span>
            {deal.isUserCreated && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-950/70 text-purple-300 border border-purple-700/50">
                Własne
              </span>
            )}
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-100 leading-snug">
            {deal.title}
          </h2>
        </div>

        {/* Quick Deal Switcher & Creator buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            title="Wybierz inne rozdanie z biblioteki"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Lekcje</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreator}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs md:text-sm font-black rounded-xl shadow-lg transition cursor-pointer"
            title="Stwórz nowe własne rozdanie dla uczniów"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Dodaj rozdanie</span>
          </button>
        </div>
      </div>

      {/* Teacher Guidance / Pedagogical Goal Box */}
      <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs md:text-sm font-black text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Cel dydaktyczny dla uczniów:</span>
        </div>
        <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
          {deal.teacherGoal || deal.description}
        </p>

        {/* Dynamic Trick note / tip if available */}
        {activeTrickNote && (
          <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-xs md:text-sm text-amber-100 flex items-start gap-2.5 animate-in fade-in shadow">
            <span className="text-amber-400 font-black shrink-0 mt-0.5">📌 Wskazówka lewy {currentTrickIndex}:</span>
            <span className="leading-snug font-medium">{activeTrickNote}</span>
          </div>
        )}

        {deal.generalNotes && !activeTrickNote && (
          <div className="text-xs text-slate-400 italic pt-1.5 border-t border-slate-700/60">
            {deal.generalNotes}
          </div>
        )}
      </div>

      {/* Controls & Presentation Toggles for Teacher */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs md:text-sm text-slate-400 font-bold">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-slate-300" />
            <span>Opcje stołu i prezentacji</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {manualControl ? 'Tryb manualny' : 'Tryb ucznia'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
          {/* Open cards toggle */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ openCards: !settings.openCards })}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
              settings.openCards
                ? 'bg-blue-600/40 border-blue-400 text-blue-100 shadow-md ring-1 ring-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {settings.openCards ? <Eye className="w-4 h-4 text-blue-300" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span>{settings.openCards ? 'Widok Trenera (Karty jawne)' : 'Widok Ucznia (Zakryte)'}</span>
          </button>

          {/* Manual Control vs Auto Play Robot */}
          <button
            type="button"
            onClick={onToggleManualControl}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
              manualControl
                ? 'bg-purple-600/40 border-purple-400 text-purple-100 shadow-md ring-1 ring-purple-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>{manualControl ? 'Sterowanie: Trener' : 'Sterowanie: Robot'}</span>
          </button>

          {/* 4-color deck toggle */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ fourColorDeck: !settings.fourColorDeck })}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 font-bold transition cursor-pointer"
          >
            <span>Talia: {settings.fourColorDeck ? '4 kolory' : '2 kolory'}</span>
          </button>

          {/* Trick collection animation speed toggle */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ fastTrickAnimation: !settings.fastTrickAnimation })}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
              settings.fastTrickAnimation
                ? 'bg-emerald-900/40 border-emerald-400 text-emerald-100'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Animacja lewy: {settings.fastTrickAnimation ? 'Szybka' : 'Spokojna'}</span>
          </button>
        </div>
      </div>

      {/* Action Row: Undo, Restart, Claim, Export */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onUndo}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            title="Cofnij ostatnie zagranie karty lub odzywkę"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Cofnij</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            title="Zrestartuj całe rozdanie od początku"
          >
            <span>Restart</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isBiddingPhase && remainingTricks > 0 && (
            <button
              type="button"
              onClick={() => {
                setClaimCount(remainingTricks);
                setShowClaimModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-black rounded-xl shadow-lg transition cursor-pointer"
              title="Zgłoś lewy bez dogrywania do końca (Claim)"
            >
              <Award className="w-4 h-4" />
              <span>Claim</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyPbn}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs md:text-sm font-bold rounded-xl border border-slate-700 transition cursor-pointer"
            title="Skopiuj rozdanie w formacie PBN"
          >
            {copiedPbn ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedPbn ? 'Skopiowano!' : 'Kopiuj PBN'}</span>
          </button>
        </div>
      </div>

      {/* Claim Modal Dialog */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl text-white">
            <h3 className="text-base font-bold text-amber-300 mb-2">Zgłoszenie lew (Claim)</h3>
            <p className="text-xs text-slate-300 mb-4">
              Pozostało {remainingTricks} {remainingTricks === 1 ? 'lewa' : 'lew'}. Ile lew bierze strona rozgrywająca (NS)?
            </p>
            <div className="flex items-center justify-center gap-3 mb-5">
              <input
                type="range"
                min="0"
                max={remainingTricks}
                value={claimCount}
                onChange={(e) => setClaimCount(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400"
              />
              <span className="font-extrabold text-xl text-amber-400 min-w-[2rem] text-center">
                {claimCount}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClaimModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => {
                  onClaimTricks(claimCount);
                  setShowClaimModal(false);
                }}
                className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 cursor-pointer shadow"
              >
                Potwierdź Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
