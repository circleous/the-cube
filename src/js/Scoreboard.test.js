import { describe, expect, it } from 'vitest';

import { Scoreboard } from './Scoreboard.js';
import { formatTime } from './formatTime.js';

describe('Scoreboard', () => {
  it('records a solve and flags the first as an improvement', () => {
    const scoreboard = new Scoreboard();

    expect(scoreboard.add(3, 5000)).toEqual({ improved: true });
    expect(scoreboard.stats(3).solves).toBe(1);
    expect(scoreboard.stats(3).best).toBe(5000);
    expect(scoreboard.stats(3).worst).toBe(5000);
  });

  it('tracks best and worst', () => {
    const scoreboard = new Scoreboard();

    [5000, 3000, 8000].forEach((time) => scoreboard.add(3, time));

    expect(scoreboard.add(3, 2000)).toEqual({ improved: true });
    expect(scoreboard.add(3, 6000)).toEqual({ improved: false });
    expect(scoreboard.stats(3).best).toBe(2000);
    expect(scoreboard.stats(3).worst).toBe(8000);
  });

  it('keeps only the last 100 scores', () => {
    const scoreboard = new Scoreboard();

    for (let i = 1; i <= 105; i++) scoreboard.add(3, i * 1000);

    const { scores } = scoreboard.data[3];

    expect(scores).toHaveLength(100);
    expect(scores[0]).toBe(6000);
    expect(scores[99]).toBe(105000);
  });

  it('averages the last N scores, and only when there are N', () => {
    const scoreboard = new Scoreboard();

    [1000, 2000, 3000, 4000, 5000].forEach((time) => scoreboard.add(3, time));

    expect(scoreboard.stats(3).average5).toBe(3000);
    expect(scoreboard.stats(3).average12).toBe(0);
  });

  it('keeps sizes independent', () => {
    const scoreboard = new Scoreboard();

    scoreboard.add(2, 1000);
    scoreboard.add(3, 9000);

    expect(scoreboard.stats(2).best).toBe(1000);
    expect(scoreboard.stats(3).best).toBe(9000);
  });
});

describe('formatTime', () => {
  it('formats milliseconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9000)).toBe('0:09');
    expect(formatTime(61000)).toBe('1:01');
    expect(formatTime(600000)).toBe('10:00');
  });
});
