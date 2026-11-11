import React, { useState, useRef } from 'react';
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  GripHorizontal,
  ChevronDown,
} from 'lucide-react';
import {
  WindowState,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  clampCoordinates,
} from '../logic/windowManager';

interface WorkspaceWindowProps {
  windowState: WindowState;
  onUpdateState: (partial: Partial<WindowState>) => void;
  onBringToFront: () => void;
  onClose: () => void;
  onToggleMinimize: () => void;
  onToggleMaximize: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerControls?: React.ReactNode;
  isFloatingMode: boolean;
}

type ResizeDirection = 'se' | 'e' | 's' | 'sw' | 'w';

export const WorkspaceWindow: React.FC<WorkspaceWindowProps> = ({
  windowState,
  onUpdateState,
  onBringToFront,
  onClose,
  onToggleMinimize,
  onToggleMaximize,
  containerRef,
  children,
  icon,
  badge,
  headerControls,
  isFloatingMode,
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Handle Drag Pointer Down
  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, input, select, a, [data-no-drag]')) {
      return;
    }
    if (!isFloatingMode || windowState.isMaximized) return;

    e.preventDefault();
    onBringToFront();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = windowState.x;
    const initY = windowState.y;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      const container = containerRef.current;
      const cW = container ? container.clientWidth : window.innerWidth;
      const cH = container ? container.clientHeight : window.innerHeight;

      const clamped = clampCoordinates(
        initX + dx,
        initY + dy,
        windowState.width,
        windowState.height || 400,
        cW,
        cH
      );

      onUpdateState({ x: clamped.x, y: clamped.y });
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Handle Resize Pointer Down
  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) => {
    if (e.button !== 0 || !isFloatingMode || windowState.isMaximized || windowState.isMinimized) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    onBringToFront();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = windowState.x;
    const initY = windowState.y;
    const initW = windowState.width;
    const initH = windowState.height || windowRef.current?.offsetHeight || 600;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;

      const container = containerRef.current;
      const cW = container ? container.clientWidth : window.innerWidth;

      const updates: Partial<WindowState> = {};

      // Width resizing (right edge or bottom-right corner)
      if (direction === 'se' || direction === 'e') {
        const maxW = Math.max(MIN_WINDOW_WIDTH, cW - initX - 10);
        const newW = Math.max(MIN_WINDOW_WIDTH, Math.min(initW + dx, maxW));
        updates.width = Math.round(newW);
      }

      // Width resizing (left edge or bottom-left corner)
      if (direction === 'sw' || direction === 'w') {
        const rawW = initW - dx;
        const clampedW = Math.max(MIN_WINDOW_WIDTH, Math.min(rawW, initX + initW - 10));
        const newX = initX + (initW - clampedW);
        updates.width = Math.round(clampedW);
        updates.x = Math.round(newX);
      }

      // Height resizing (bottom edge or bottom corners)
      if (direction === 'se' || direction === 's' || direction === 'sw') {
        const newH = Math.max(MIN_WINDOW_HEIGHT, Math.min(initH + dy, 2000));
        updates.height = Math.round(newH);
      }

      onUpdateState(updates);
    };

    const onPointerUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  if (!windowState.isOpen) return null;

  // Floating styles vs Grid mode styles
  const floatingStyle: React.CSSProperties = isFloatingMode
    ? {
        position: 'absolute',
        left: `${windowState.x}px`,
        top: `${windowState.y}px`,
        width: `${windowState.width}px`,
        height: windowState.isMinimized ? 'auto' : windowState.height ? `${windowState.height}px` : 'auto',
        zIndex: windowState.zIndex,
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.15s ease',
      }
    : {
        position: 'relative',
        width: '100%',
        height: windowState.isMinimized ? 'auto' : '100%',
      };

  return (
    <div
      ref={windowRef}
      style={floatingStyle}
      onPointerDown={() => isFloatingMode && onBringToFront()}
      className={`
        rounded-2xl flex flex-col overflow-hidden bg-slate-900 border transition-all duration-150 select-none relative
        ${
          isDragging
            ? 'border-amber-400 shadow-2xl ring-2 ring-amber-400/40 opacity-95 scale-[1.002]'
            : isResizing
            ? 'border-blue-400 shadow-2xl ring-2 ring-blue-400/40'
            : 'border-slate-800 shadow-xl hover:border-slate-700'
        }
      `}
    >
      {/* Window Header / Titlebar */}
      <div
        onPointerDown={handleDragPointerDown}
        onDoubleClick={onToggleMinimize}
        className={`
          px-3.5 py-2.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-white shrink-0
          ${isFloatingMode && !windowState.isMaximized ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
        `}
      >
        {/* Title and Icon */}
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {isFloatingMode && (
            <GripHorizontal className="w-4 h-4 text-slate-500 shrink-0 hover:text-slate-300" />
          )}
          {icon && <span className="text-amber-400 shrink-0">{icon}</span>}
          <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate text-slate-100">
            {windowState.title}
          </span>
          {badge}
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0" data-no-drag>
          {headerControls}

          {/* Minimize / Collapse Button */}
          <button
            type="button"
            onClick={onToggleMinimize}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title={windowState.isMinimized ? 'Rozwiń okno' : 'Zwiń okno'}
            aria-label={windowState.isMinimized ? 'Rozwiń okno' : 'Zwiń okno'}
          >
            {windowState.isMinimized ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Maximize / Restore Button (in floating mode) */}
          {isFloatingMode && (
            <button
              type="button"
              onClick={onToggleMaximize}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              title={windowState.isMaximized ? 'Przywróć rozmiar' : 'Maksymalizuj okno'}
              aria-label={windowState.isMaximized ? 'Przywróć rozmiar' : 'Maksymalizuj okno'}
            >
              {windowState.isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Hide / Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-400 flex items-center justify-center transition cursor-pointer"
            title="Schowaj to okno (możesz je przywrócić z dolnego paska)"
            aria-label="Schowaj okno"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Window Body (Content) */}
      {!windowState.isMinimized && (
        <div className="flex-1 overflow-auto relative flex flex-col min-h-0">
          {children}
        </div>
      )}

      {/* Resize Handles (Only in Floating Mode and when not minimized or maximized) */}
      {isFloatingMode && !windowState.isMaximized && !windowState.isMinimized && (
        <>
          {/* Right Edge Handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'e')}
            className="absolute top-10 right-0 bottom-7 w-3 cursor-e-resize hover:bg-amber-400/30 transition-colors z-40 touch-none"
            title="Przeciągnij prawą krawędź, aby zmienić szerokość"
          />

          {/* Bottom Edge Handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 's')}
            className="absolute bottom-0 left-7 right-7 h-3 cursor-s-resize hover:bg-amber-400/30 transition-colors z-40 touch-none"
            title="Przeciągnij dolną krawędź, aby zmienić wysokość"
          />

          {/* Left Edge Handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'w')}
            className="absolute top-10 left-0 bottom-7 w-3 cursor-w-resize hover:bg-amber-400/30 transition-colors z-40 touch-none"
            title="Przeciągnij lewą krawędź, aby zmienić szerokość"
          />

          {/* Bottom-Right Corner Handle (Prominent grip) */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize flex items-center justify-center text-slate-400 hover:text-amber-400 z-50 touch-none group"
            title="Przeciągnij narożnik, aby zmienić rozmiar okna"
          >
            <div className="w-5 h-5 flex items-center justify-center rounded group-hover:bg-amber-400/25 transition">
              <svg className="w-3.5 h-3.5 fill-current opacity-70 group-hover:opacity-100" viewBox="0 0 10 10">
                <circle cx="8" cy="8" r="1.3" />
                <circle cx="4" cy="8" r="1.3" />
                <circle cx="8" cy="4" r="1.3" />
              </svg>
            </div>
          </div>

          {/* Bottom-Left Corner Handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
            className="absolute bottom-0 left-0 w-7 h-7 cursor-sw-resize flex items-center justify-center text-slate-500 hover:text-amber-400 z-50 touch-none"
            title="Przeciągnij lewy dolny narożnik"
          />
        </>
      )}
    </div>
  );
};
