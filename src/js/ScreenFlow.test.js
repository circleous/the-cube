import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ScreenFlow } from './ScreenFlow.js';

function fakeTransition() {
  const calls = [];
  const record =
    (name) =>
    (...args) => {
      calls.push([name, ...args]);
    };

  return {
    calls,
    activeTransitions: 0,
    durations: { zoom: 2000 },
    buttons: record('buttons'),
    cube: record('cube'),
    float: record('float'),
    elevate: record('elevate'),
    complete: record('complete'),
    stats: record('stats'),
    preferences: record('preferences'),
    theming: record('theming'),
    title: record('title'),
    timer: record('timer'),
    zoom: (playing, time) => {
      calls.push(['zoom', playing, time]);
    },
  };
}

function fakeHandlers() {
  const order = [];

  const handler = (name, result) => {
    const fn = vi.fn(() => {
      order.push(name);
      return result;
    });
    return fn;
  };

  return {
    order,
    onScramble: handler('onScramble', 0),
    onPlayReady: handler('onPlayReady'),
    onPlayExit: handler('onPlayExit'),
    onPrefsExit: handler('onPrefsExit'),
    onStatsEnter: handler('onStatsEnter'),
    onThemeEnter: handler('onThemeEnter'),
    onThemeExit: handler('onThemeExit'),
    onThemeRestoreCube: handler('onThemeRestoreCube'),
    onThemeReset: handler('onThemeReset'),
    onSolve: handler('onSolve', true),
    onCelebrate: handler('onCelebrate'),
    onCompleteExit: handler('onCompleteExit'),
    onCompleteCleanup: handler('onCompleteCleanup'),
  };
}

function flow() {
  const transition = fakeTransition();
  const handlers = fakeHandlers();
  return { transition, handlers, flow: new ScreenFlow(transition, handlers) };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('ScreenFlow', () => {
  it('starts on the menu and plays the intro', () => {
    const { transition, flow: screenFlow } = flow();

    expect(screenFlow.screen).toBe('menu');

    screenFlow.start();
    vi.advanceTimersByTime(1000);

    expect(transition.calls.map(([name]) => name)).toContain('float');
    expect(transition.calls.filter(([name]) => name === 'buttons')).toHaveLength(1);
  });

  it('moves menu -> playing, scrambles, then readies play after the zoom', () => {
    const { transition, handlers, flow: screenFlow } = flow();

    expect(screenFlow.go('playing')).toBe(true);
    expect(screenFlow.screen).toBe('playing');

    expect(handlers.onScramble).toHaveBeenCalledOnce();
    expect(transition.calls[0][0]).toBe('buttons');

    vi.advanceTimersByTime(2000);

    expect(handlers.onPlayReady).toHaveBeenCalledOnce();
  });

  it('calls the scramble handler before animating', () => {
    const { handlers, flow: screenFlow } = flow();

    screenFlow.go('playing');

    expect(handlers.order[0]).toBe('onScramble');
  });

  it('refuses an illegal edge', () => {
    const { flow: screenFlow } = flow();

    expect(screenFlow.go('theme')).toBe(false);
    expect(screenFlow.screen).toBe('menu');
  });

  it('ignores input while a transition is busy', () => {
    const { transition, flow: screenFlow } = flow();

    transition.activeTransitions = 1;

    expect(screenFlow.go('playing')).toBe(false);
    expect(screenFlow.screen).toBe('menu');
  });

  it('routes back from each screen to its target', () => {
    const { flow: screenFlow } = flow();

    screenFlow.go('stats');
    expect(screenFlow.back()).toBe(true);
    expect(screenFlow.screen).toBe('menu');

    screenFlow.go('prefs');
    screenFlow.go('theme');
    expect(screenFlow.screen).toBe('theme');

    screenFlow.back();
    expect(screenFlow.screen).toBe('prefs');
  });

  it('advances complete -> stats and cleans up after the delay', () => {
    const { handlers, flow: screenFlow } = flow();

    screenFlow.go('playing');
    screenFlow.go('complete');

    expect(screenFlow.screen).toBe('complete');
    expect(handlers.onSolve).toHaveBeenCalledOnce();

    screenFlow.go('stats');
    expect(screenFlow.screen).toBe('stats');
    expect(handlers.onCompleteExit).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1000);

    expect(handlers.onCompleteCleanup).toHaveBeenCalledOnce();
  });

  it('delegates a theme reset to the handler', () => {
    const { handlers, flow: screenFlow } = flow();

    screenFlow.resetTheme();

    expect(handlers.onThemeReset).toHaveBeenCalledOnce();
  });
});
