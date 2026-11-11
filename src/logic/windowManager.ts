export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height?: number;
}

export interface WindowState {
  id: string;
  title: string;
  iconName?: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  zIndex: number;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  prevBounds?: WindowBounds;
}

export const MIN_WINDOW_WIDTH = 280;
export const MIN_WINDOW_HEIGHT = 160;

/**
 * Clamps coordinates so windows stay accessible inside the workspace
 */
export function clampCoordinates(
  x: number,
  y: number,
  width: number,
  height: number = 60,
  containerWidth: number = 1920,
  containerHeight: number = 1080
): { x: number; y: number } {
  const minVisible = 80; // ensure at least 80px remains inside view
  const maxX = Math.max(0, containerWidth - minVisible);
  const maxY = Math.max(0, containerHeight - 40);

  const clampedX = Math.max(-width + minVisible, Math.min(x, maxX));
  const clampedY = Math.max(0, Math.min(y, maxY));

  return { x: Math.round(clampedX), y: Math.round(clampedY) };
}

/**
 * Bring targeted window to highest zIndex
 */
export function bringWindowToFront(
  windows: Record<string, WindowState>,
  targetId: string
): Record<string, WindowState> {
  if (!windows[targetId]) return windows;

  const currentMax = Math.max(
    ...Object.values(windows).map(w => w.zIndex || 1),
    10
  );

  return {
    ...windows,
    [targetId]: {
      ...windows[targetId],
      zIndex: currentMax + 1,
    },
  };
}

/**
 * Toggle minimized state of a window
 */
export function toggleWindowMinimize(
  windows: Record<string, WindowState>,
  targetId: string
): Record<string, WindowState> {
  const win = windows[targetId];
  if (!win) return windows;

  return {
    ...windows,
    [targetId]: {
      ...win,
      isMinimized: !win.isMinimized,
    },
  };
}

/**
 * Toggle maximized state of a window
 */
export function toggleWindowMaximize(
  windows: Record<string, WindowState>,
  targetId: string,
  containerWidth: number,
  containerHeight: number
): Record<string, WindowState> {
  const win = windows[targetId];
  if (!win) return windows;

  if (win.isMaximized) {
    // Restore previous bounds
    const restored = win.prevBounds || { x: 20, y: 20, width: 600, height: 450 };
    return {
      ...windows,
      [targetId]: {
        ...win,
        isMaximized: false,
        x: restored.x,
        y: restored.y,
        width: restored.width,
        height: restored.height,
        prevBounds: undefined,
      },
    };
  } else {
    // Save current bounds and maximize
    const currentBounds: WindowBounds = {
      x: win.x,
      y: win.y,
      width: win.width,
      height: win.height,
    };

    return {
      ...windows,
      [targetId]: {
        ...win,
        isMaximized: true,
        prevBounds: currentBounds,
        x: 10,
        y: 10,
        width: Math.max(MIN_WINDOW_WIDTH, containerWidth - 20),
        height: Math.max(MIN_WINDOW_HEIGHT, containerHeight - 20),
      },
    };
  }
}

/**
 * Toggle open / closed state
 */
export function setWindowOpen(
  windows: Record<string, WindowState>,
  targetId: string,
  isOpen: boolean
): Record<string, WindowState> {
  const win = windows[targetId];
  if (!win) return windows;

  return {
    ...windows,
    [targetId]: {
      ...win,
      isOpen,
      // If opening, bring to front
      zIndex: isOpen ? Math.max(...Object.values(windows).map(w => w.zIndex || 1), 10) + 1 : win.zIndex,
    },
  };
}

/**
 * Generate default balanced desktop layout
 */
export function getDefaultWindowsLayout(
  containerWidth: number = 1440,
  containerHeight: number = 900
): Record<string, WindowState> {
  const isLarge = containerWidth >= 1200;

  if (isLarge) {
    const leftWidth = Math.min(920, Math.round(containerWidth * 0.62));
    const rightWidth = Math.max(360, containerWidth - leftWidth - 45);

    return {
      table: {
        id: 'table',
        title: 'Stół Brydżowy (BBO Felt)',
        x: 16,
        y: 16,
        width: leftWidth,
        height: 640,
        zIndex: 10,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
      },
      biddingBox: {
        id: 'biddingBox',
        title: 'Skrzynka Licytacyjna i Lewy',
        x: 16,
        y: 672,
        width: Math.round(leftWidth * 0.5 - 8),
        height: 320,
        zIndex: 11,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
      },
      biddingHistory: {
        id: 'biddingHistory',
        title: 'Protokół i Przebieg Licytacji',
        x: 16 + Math.round(leftWidth * 0.5),
        y: 672,
        width: Math.round(leftWidth * 0.5 - 8),
        height: 320,
        zIndex: 12,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
      },
      teacherPanel: {
        id: 'teacherPanel',
        title: 'Panel Instruktora i Lekcje',
        x: 16 + leftWidth + 16,
        y: 16,
        width: rightWidth,
        height: 720,
        zIndex: 13,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
      },
    };
  }

  // Tablet / smaller view layout
  const fullWidth = Math.max(320, containerWidth - 32);
  return {
    table: {
      id: 'table',
      title: 'Stół Brydżowy (BBO Felt)',
      x: 16,
      y: 16,
      width: fullWidth,
      height: 580,
      zIndex: 10,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
    },
    biddingBox: {
      id: 'biddingBox',
      title: 'Skrzynka Licytacyjna i Lewy',
      x: 16,
      y: 610,
      width: Math.min(fullWidth, 480),
      height: 320,
      zIndex: 11,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
    },
    biddingHistory: {
      id: 'biddingHistory',
      title: 'Protokół i Przebieg Licytacji',
      x: 16,
      y: 945,
      width: Math.min(fullWidth, 480),
      height: 320,
      zIndex: 12,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
    },
    teacherPanel: {
      id: 'teacherPanel',
      title: 'Panel Instruktora i Lekcje',
      x: 16,
      y: 1280,
      width: fullWidth,
      height: 650,
      zIndex: 13,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
    },
  };
}
