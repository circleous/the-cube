import { describe, expect, it } from 'vitest';

import { Scrambler } from './Scrambler.js';

// Deterministic stand-in for Math.random.
function seeded(seed) {
  let state = seed;

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('Scrambler', () => {
  it('generates the requested length per difficulty', () => {
    const scrambler = new Scrambler();

    [0, 1, 2].forEach((difficulty) => {
      scrambler.generate({ size: 3, difficulty, rng: seeded(1) });
      expect(scrambler.moves).toHaveLength(scrambler.scrambleLength[3][difficulty]);
    });
  });

  it('is deterministic for a given seed', () => {
    const a = new Scrambler().generate({ size: 3, difficulty: 2, rng: seeded(42) });
    const b = new Scrambler().generate({ size: 3, difficulty: 2, rng: seeded(42) });

    expect(a.moves).toEqual(b.moves);
  });

  it('avoids repeating a face on consecutive moves', () => {
    const scrambler = new Scrambler().generate({ size: 3, difficulty: 2, rng: seeded(7) });

    for (let i = 1; i < scrambler.moves.length; i++) {
      expect(scrambler.moves[i][0]).not.toBe(scrambler.moves[i - 1][0]);
    }
  });

  it('expands double moves into two quarter turns', () => {
    const scrambler = new Scrambler().generate({ size: 3, difficulty: 2, rng: seeded(3) });
    const doubles = scrambler.moves.filter((move) => move[1] === '2').length;

    expect(scrambler.sequence).toHaveLength(scrambler.moves.length + doubles);
  });

  it('uses inner layers as well as outer ones on wide cubes', () => {
    const scrambler = new Scrambler().generate({ size: 5, difficulty: 0, rng: seeded(9) });
    const faces = new Set(scrambler.moves.map((move) => move[0].toUpperCase()));

    expect(faces.size).toBeGreaterThan(1);
    expect(scrambler.moves.some((move) => move[0] === move[0].toLowerCase())).toBe(true);
  });
});
