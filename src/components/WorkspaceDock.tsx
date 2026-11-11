import React from 'react';
import {
  LayoutGrid,
  Move,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Compass,
  FileSpreadsheet,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { WindowState } from '../logic/windowManager';

interface WorkspaceDockProps {
  windows: Record<string, WindowState>;
  onToggleOpen: (id: string) => void;
  onBringToFront: (id: string) => void;
  isFloatingMode: boolean;
  onToggleFloatingMode: () => void;
  onResetLayout: () => void;
  onMinimizeAll: () => void;
  onRestoreAll: () => void;
}

export const WorkspaceDock: React.FC<WorkspaceDockProps> = ({
  windows,
  onToggleOpen,
  onBringToFront,
  isFloatingMode,
  onToggleFloatingMode,
  onResetLayout,
  onMinimizeAll,
  onRestoreAll,
}) => {
  const windowList = [
    {
      id: 'table',
      name: 'Stół BBO',
      icon: <Compass className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'biddingBox',
      name: 'Licytacja / Lewy',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'biddingHistory',
      name: 'Protokół licytacji',
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'teacherPanel',
      name: 'Panel Trenera',
      icon: <GraduationCap className="w-4 h-4 text-purple-400" />,
    },
  ];

  return (
    <footer className="sticky bottom-0 z-40 bg-slate-900/95 border-t border-slate-800 px-3 sm:px-5 py-2.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-2xl">
      {/* Left: Window items list */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full py-0.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
          Okna:
        </span>

        {windowList.map(item => {
          const win = windows[item.id];
          if (!win) return null;

          const isOpen = win.isOpen;
          const isMinimized = win.isMinimized;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (!isOpen) {
                  onToggleOpen(item.id);
                } else if (isMinimized) {
                  onBringToFront(item.id);
                } else {
                  onBringToFront(item.id);
                }
              }}
              className={`
                flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none
                ${
                  !isOpen
                    ? 'bg-slate-800/50 border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                    : isMinimized
                    ? 'bg-slate-800 border-amber-500/50 text-amber-300 shadow-xs ring-1 ring-amber-500/30'
                    : 'bg-slate-800 border-slate-600 text-white shadow hover:border-slate-500'
                }
              `}
              title={`${item.name} (${!isOpen ? 'Zamknięte - kliknij aby otworzyć' : isMinimized ? 'Zwinięte - kliknij aby przywrócić' : 'Aktywne - kliknij aby przenieść na wierzch'})`}
            >
              {item.icon}
              <span className="whitespace-nowrap">{item.name}</span>

              {/* Status indicator pill */}
              <span
                className={`w-2 h-2 rounded-full ${
                  !isOpen ? 'bg-slate-600' : isMinimized ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Right: Workspace mode switcher and Reset button */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {/* Toggle Mode: Floating vs Tiled Grid */}
        <button
          type="button"
          onClick={onToggleFloatingMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
            isFloatingMode
              ? 'bg-amber-500/20 border-amber-400/60 text-amber-300 ring-1 ring-amber-400/30'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title="Przełącz między swobodnym przesuwaniem okien a klasyczną siatką"
        >
          {isFloatingMode ? <Move className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
          <span>{isFloatingMode ? 'Układ: Swobodne okna' : 'Układ: Siatka (Auto)'}</span>
        </button>

        {/* Reset window positions button */}
        <button
          type="button"
          onClick={onResetLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          title="Przywróć domyślne ułożenie i rozmiary wszystkich okien"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Resetuj układ</span>
        </button>
      </div>
    </footer>
  );
};
