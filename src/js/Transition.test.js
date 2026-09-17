import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Transition } from './Transition.js';

function fakeGame(stats = 7) {
  const container = document.createElement('div');

  for (let i = 0; i < stats; i++) {
    const stat = document.createElement('div');
    stat.className = 'stats';
    container.appendChild(stat);
  }

  return { dom: { stats: container } };
}

function transitionWith(stats) {
  const transition = new Transition(fakeGame(stats));

  transition.tweens.stats = [];

  return transition;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// `ScreenFlow` rejects navigation while `activeTransitions > 0`, so the stats
// rows must keep that count up until the last one finishes. Releasing it early
// lets a second screen start on top of the rows still sliding.
describe('Transition.stats', () => {
  it('stays busy until the last row finishes hiding', () => {
    const transition = transitionWith(7);

    transition.stats(false);

    expect(transition.activeTransitions).toBe(1);

    vi.advanceTimersByTime(700);

    expect(transition.activeTransitions).toBe(1);

    vi.advanceTimersByTime(60);

    expect(transition.activeTransitions).toBe(0);
  });

  it('stays busy until the last row finishes showing', () => {
    const transition = transitionWith(7);

    transition.stats(true);

    expect(transition.activeTransitions).toBe(1);

    vi.advanceTimersByTime(800);

    expect(transition.activeTransitions).toBe(1);

    vi.advanceTimersByTime(80);

    expect(transition.activeTransitions).toBe(0);
  });
});
