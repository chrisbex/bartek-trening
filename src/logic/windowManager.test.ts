import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampCoordinates,
  bringWindowToFront,
  toggleWindowMinimize,
  toggleWindowMaximize,
  setWindowOpen,
  getDefaultWindowsLayout,
  MIN_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
} from './windowManager';

test('clampCoordinates keeps window on screen', () => {
  const containerW = 1000;
  const containerH = 800;

  // Within bounds
  const ok = clampCoordinates(100, 100, 400, 300, containerW, containerH);
  assert.equal(ok.x, 100);
  assert.equal(ok.y, 100);

  // Far negative y
  const negY = clampCoordinates(100, -500, 400, 300, containerW, containerH);
  assert.equal(negY.y, 0);

  // Far positive x
  const farX = clampCoordinates(2000, 100, 400, 300, containerW, containerH);
  assert.ok(farX.x <= containerW);
});

test('bringWindowToFront raises target window zIndex', () => {
  const layout = getDefaultWindowsLayout(1440, 900);
  const updated = bringWindowToFront(layout, 'table');
  assert.ok(updated.table.zIndex > layout.teacherPanel.zIndex);
});

test('toggleWindowMinimize toggles minimized flag', () => {
  const layout = getDefaultWindowsLayout(1440, 900);
  assert.equal(layout.table.isMinimized, false);

  const minimized = toggleWindowMinimize(layout, 'table');
  assert.equal(minimized.table.isMinimized, true);

  const restored = toggleWindowMinimize(minimized, 'table');
  assert.equal(restored.table.isMinimized, false);
});

test('toggleWindowMaximize saves previous bounds and restores them', () => {
  const layout = getDefaultWindowsLayout(1440, 900);
  const origW = layout.table.width;
  const origX = layout.table.x;

  const maximized = toggleWindowMaximize(layout, 'table', 1440, 900);
  assert.equal(maximized.table.isMaximized, true);
  assert.ok(maximized.table.width >= 1400);

  const restored = toggleWindowMaximize(maximized, 'table', 1440, 900);
  assert.equal(restored.table.isMaximized, false);
  assert.equal(restored.table.width, origW);
  assert.equal(restored.table.x, origX);
});

test('setWindowOpen updates open state and brings to front if opened', () => {
  const layout = getDefaultWindowsLayout(1440, 900);
  const closed = setWindowOpen(layout, 'biddingBox', false);
  assert.equal(closed.biddingBox.isOpen, false);

  const opened = setWindowOpen(closed, 'biddingBox', true);
  assert.equal(opened.biddingBox.isOpen, true);
  assert.ok(opened.biddingBox.zIndex > 10);
});
