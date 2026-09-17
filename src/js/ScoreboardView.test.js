import { beforeEach, describe, expect, it } from 'vitest';

import { renderStats } from './ScoreboardView.js';

const ROWS = [
  'cube-size',
  'total-solves',
  'best-time',
  'worst-time',
  'average-5',
  'average-12',
  'average-25',
];

function container() {
  document.body.innerHTML = `<div id="stats">${ROWS.map(
    (name) => `<div class="stats" name="${name}"><b></b></div>`,
  ).join('')}</div>`;

  return document.querySelector('#stats');
}

function value(name) {
  return document.querySelector(`.stats[name="${name}"] b`).innerHTML;
}

beforeEach(() => container());

describe('renderStats', () => {
  it('renders the cube size and solve count', () => {
    renderStats(container(), {
      size: 3,
      stats: { solves: 4, best: 0, worst: 0, average5: 0, average12: 0, average25: 0 },
    });

    expect(value('cube-size')).toBe('3<i>x</i>3<i>x</i>3');
    expect(value('total-solves')).toBe('4');
  });

  it('formats times and blanks absent values', () => {
    renderStats(container(), {
      size: 3,
      stats: { solves: 0, best: 65000, worst: 0, average5: 0, average12: 72000, average25: 60000 },
    });

    expect(value('best-time')).toBe('1:05');
    expect(value('worst-time')).toBe('-');
    expect(value('average-5')).toBe('-');
    expect(value('average-12')).toBe('1:12');
    expect(value('average-25')).toBe('1:00');
  });

  it('shows a dash for no solves', () => {
    renderStats(container(), {
      size: 2,
      stats: { solves: 0, best: 0, worst: 0, average5: 0, average12: 0, average25: 0 },
    });

    expect(value('total-solves')).toBe('-');
  });
});
