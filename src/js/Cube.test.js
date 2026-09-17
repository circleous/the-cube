import { describe, expect, it } from 'vitest';

import { Cube } from './Cube.js';

function notation(cube, sequence) {
  sequence
    .split(' ')
    .filter(Boolean)
    .forEach((name) => cube.applyNotation(name));
}

describe('Cube', () => {
  it('starts solved', () => {
    expect(new Cube(3).isSolved()).toBe(true);
  });

  it('is not solved after a turn', () => {
    const cube = new Cube(3);

    cube.applyNotation('R');

    expect(cube.isSolved()).toBe(false);
  });

  it('undoes a turn with its inverse', () => {
    const cube = new Cube(3);

    notation(cube, "R R'");

    expect(cube.isSolved()).toBe(true);
  });

  it('returns to solved after four quarter turns', () => {
    const cube = new Cube(3);

    notation(cube, 'R R R R');

    expect(cube.isSolved()).toBe(true);
  });

  it('selects nine pieces per outer layer on 3x3', () => {
    const cube = new Cube(3);

    expect(cube.layer('x', 0)).toHaveLength(9);
    expect(cube.layer('x', 2)).toHaveLength(9);
    expect(cube.layer('y', 1)).toHaveLength(9);
  });

  it('selects the outer and inner rows on wide sizes', () => {
    const cube = new Cube(4);

    expect(cube.layer('x', 3)).toHaveLength(16);
    expect(cube.layer('x', 2)).toHaveLength(16);
  });

  it('rotates each affected piece and leaves the rest alone', () => {
    const cube = new Cube(3);

    cube.apply({ axis: 'x', layer: 2, turns: -1 });

    expect(cube.byName.get(18).cell).toEqual([2, 0, 2]);
    expect(cube.byName.get(0).cell).toEqual([0, 0, 0]);
  });

  it('round-trips a snapshot', () => {
    const cube = new Cube(3);

    notation(cube, "R U F'");
    const snapshot = cube.snapshot();

    notation(cube, 'L D B');

    cube.restore(snapshot);

    expect(cube.snapshot()).toEqual(snapshot);
  });

  it('restores a solved cube when reset through build', () => {
    const cube = new Cube(3);

    notation(cube, 'R U F');
    cube.build();

    expect(cube.isSolved()).toBe(true);
    expect(cube.snapshot().pieces[0].cell).toEqual([0, 0, 0]);
  });

  it('is solved after solving a scramble in reverse', () => {
    const cube = new Cube(3);

    notation(cube, "R U R' U' F2 L2");
    notation(cube, "L2 F2 U R U' R'");

    expect(cube.isSolved()).toBe(true);
  });
});
