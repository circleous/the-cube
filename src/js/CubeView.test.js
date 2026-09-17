import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import { Cube } from './Cube.js';
import { CubeView } from './CubeView.js';

const PALETTE = {
  U: 0xffffff,
  D: 0xffef48,
  F: 0xef3923,
  R: 0x41aac8,
  B: 0xff8c0a,
  L: 0x82ca38,
  P: 0x08101a,
  G: 0xd1d5db,
};

function fakeGame(size = 3) {
  return {
    world: { scene: new THREE.Scene() },
    themes: { getColors: () => PALETTE },
    preferences: { ranges: { size: { value: size } } },
    storage: { clearGame() {} },
    timer: { reset() {} },
    saved: false,
  };
}

function build(size = 3) {
  const model = new Cube(size);
  const view = new CubeView(fakeGame(size), model);

  view.build();

  return { model, view };
}

// Piece index for grid cell (x, y, z) on a size cube, matching model.generate order.
function nameAt(x, y, z, size = 3) {
  return x * size * size + y * size + z;
}

describe('CubeView', () => {
  it('builds one mesh per piece and one sticker per visible facelet', () => {
    const { view } = build(3);

    expect(view.pieces).toHaveLength(27);
    expect(view.stickers).toHaveLength(54);
    expect(view.cubes).toHaveLength(27);
  });

  it('renders pieces at the original world scale', () => {
    const { model, view } = build(3);
    const piece = view.objects.get(nameAt(0, 0, 0));

    expect(piece.position.toArray()).toEqual(model.toWorld([0, 0, 0]));
    expect(piece.position.x).toBeCloseTo(-1 / 3);
  });

  it('moves the meshes to match the model when a layer turn commits', () => {
    const { model, view } = build(3);

    view.beginLayer(new THREE.Vector3(1, 0, 0), model.layer('x', 2));
    view.commitLayer({ axis: 'x', layer: 2, turns: -1 });

    // (2,0,0) rotates to (2,0,2) under a -90 turn about x.
    expect(model.byName.get(nameAt(2, 0, 0)).cell).toEqual([2, 0, 2]);
    expect(view.objects.get(nameAt(2, 0, 0)).position.toArray()).toEqual(model.toWorld([2, 0, 2]));
    expect(view.objects.get(nameAt(2, 0, 0)).parent).toBe(view.object);
  });

  it('keeps every mesh a child of the cube object after a turn', () => {
    const { model, view } = build(3);

    view.beginLayer(new THREE.Vector3(0, 1, 0), model.layer('y', 0));
    view.commitLayer({ axis: 'y', layer: 0, turns: 1 });

    expect([...view.objects.values()].every((object) => object.parent === view.object)).toBe(true);
  });

  it('renders the model orientation', () => {
    const { model, view } = build(3);

    model.orient('y', 1);
    view.syncOrientation();

    const expected = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI / 2,
    );

    expect(view.object.quaternion.angleTo(expected)).toBeCloseTo(0);
  });
});
