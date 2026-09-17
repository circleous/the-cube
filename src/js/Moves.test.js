import { describe, expect, it } from 'vitest';

import { fromNotation, layerForRow } from './Moves.js';

function first(name, size) {
  return fromNotation(name, size)[0];
}

describe('Moves', () => {
  it('parses a face turn', () => {
    expect(first('R', 3)).toEqual({ axis: 'x', row: 1, layer: 2, turns: -1, name: 'R' });
  });

  it('parses the opposite face', () => {
    expect(first('L', 3)).toEqual({ axis: 'x', row: -1, layer: 0, turns: 1, name: 'L' });
  });

  it('parses a prime modifier', () => {
    expect(first("U'", 3).turns).toBe(1);
  });

  it('expands a double modifier into two moves', () => {
    const moves = fromNotation('F2', 3);

    expect(moves).toHaveLength(2);
    expect(moves[0]).toEqual(moves[1]);
    expect(moves[0].turns).toBe(-1);
  });

  it('maps uppercase and lowercase faces to outer and inner rows', () => {
    expect(first('R', 4)).toMatchObject({ layer: 3, turns: -2 });
    expect(first('r', 4)).toMatchObject({ layer: 2, turns: -1 });
    expect(first('U', 5)).toMatchObject({ layer: 4, turns: -2 });
    expect(first('u', 5)).toMatchObject({ layer: 3, turns: -1 });
  });

  it('resolves a row to a grid layer', () => {
    expect(layerForRow(3, 1)).toBe(2);
    expect(layerForRow(3, -1)).toBe(0);
    expect(layerForRow(4, 2)).toBe(3);
    expect(layerForRow(4, -1)).toBe(1);
    expect(layerForRow(5, 2)).toBe(4);
    expect(layerForRow(5, -1)).toBe(1);
  });
});
