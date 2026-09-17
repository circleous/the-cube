import { AXIS_INDEX, fromNotation, layerForRow } from './Moves.js';

// The puzzle, as data. Cells are grid indices (0..size-1); orientation is a 3x3
// signed-permutation matrix (local -> cube frame) stored row-major. Nothing here
// touches three.js, the DOM or storage, so the whole model is testable headless.
//
// The three.js view (`CubeView`) is an adapter that reads this model and renders it;
// it is the only module allowed to know about meshes.

const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];

const NORMALS = {
  L: [-1, 0, 0],
  R: [1, 0, 0],
  D: [0, -1, 0],
  U: [0, 1, 0],
  B: [0, 0, -1],
  F: [0, 0, 1],
};

const UNIT = {
  x: [1, 0, 0],
  y: [0, 1, 0],
  z: [0, 0, 1],
};

// Quarter-turn matrices about the positive axis (right-handed), row-major.
const QUARTER = {
  x: [1, 0, 0, 0, 0, -1, 0, 1, 0],
  y: [0, 0, 1, 0, 1, 0, -1, 0, 0],
  z: [0, -1, 0, 1, 0, 0, 0, 0, 1],
};

function multiply(a, b) {
  const out = Array.from({ length: 9 }, () => 0);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      out[row * 3 + col] =
        a[row * 3] * b[col] + a[row * 3 + 1] * b[3 + col] + a[row * 3 + 2] * b[6 + col];
    }
  }

  return out;
}

function applyMatrix(matrix, vector) {
  return [
    matrix[0] * vector[0] + matrix[1] * vector[1] + matrix[2] * vector[2],
    matrix[3] * vector[0] + matrix[4] * vector[1] + matrix[5] * vector[2],
    matrix[6] * vector[0] + matrix[7] * vector[1] + matrix[8] * vector[2],
  ];
}

function transpose(matrix) {
  return [
    matrix[0],
    matrix[3],
    matrix[6],
    matrix[1],
    matrix[4],
    matrix[7],
    matrix[2],
    matrix[5],
    matrix[8],
  ];
}

function rotationMatrix(axis, turns) {
  const steps = ((turns % 4) + 4) % 4;
  let matrix = IDENTITY.slice();

  for (let step = 0; step < steps; step++) matrix = multiply(QUARTER[axis], matrix);

  return matrix;
}

function dominantAxis(vector) {
  return ['x', 'y', 'z'].reduce((best, axis) =>
    Math.abs(vector[AXIS_INDEX[axis]]) > Math.abs(vector[AXIS_INDEX[best]]) ? axis : best,
  );
}

class Cube {
  constructor(size = 3) {
    this.size = size;
    this.build();
  }

  setSize(size) {
    this.size = size;
    this.build();
  }

  // Solved state for the current size: pieces at their home cells, identity orientation.
  build() {
    const { size } = this;
    const last = size - 1;

    this.orientation = IDENTITY.slice();
    this.pieces = [];
    this.byName = new Map();

    let name = 0;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        for (let z = 0; z < size; z++) {
          const cell = [x, y, z];
          const stickers = [];

          if (x === 0) stickers.push({ name: 'L', normal: NORMALS.L });
          if (x === last) stickers.push({ name: 'R', normal: NORMALS.R });
          if (y === 0) stickers.push({ name: 'D', normal: NORMALS.D });
          if (y === last) stickers.push({ name: 'U', normal: NORMALS.U });
          if (z === 0) stickers.push({ name: 'B', normal: NORMALS.B });
          if (z === last) stickers.push({ name: 'F', normal: NORMALS.F });

          const piece = { name, cell, orientation: IDENTITY.slice(), stickers };

          this.pieces.push(piece);
          this.byName.set(name, piece);
          name++;
        }
      }
    }
  }

  // Piece names whose cell sits on the given layer.
  layer(axis, index) {
    const coordinate = AXIS_INDEX[axis];

    return this.pieces
      .filter((piece) => piece.cell[coordinate] === index)
      .map((piece) => piece.name);
  }

  // Apply a local move. Mutates in place so the pointer-drag and render loops don't
  // allocate per frame; returns the affected piece names so the view can animate them.
  apply(move) {
    const matrix = rotationMatrix(move.axis, move.turns);
    const affected = this.layer(move.axis, move.layer);
    const center = (this.size - 1) / 2;

    affected.forEach((name) => {
      const piece = this.byName.get(name);

      piece.cell = applyMatrix(
        matrix,
        piece.cell.map((value) => value - center),
      ).map((value) => value + center);
      piece.orientation = multiply(matrix, piece.orientation);
    });

    return affected;
  }

  // Apply camera-relative notation by rotating it into the cube's current orientation.
  applyNotation(name) {
    let affected = [];

    this.localMoves(name).forEach((move) => {
      affected = affected.concat(this.apply(move));
    });

    return affected;
  }

  // The local moves a notation string denotes at the current orientation, without
  // applying them. The view animates these one by one.
  localMoves(name) {
    const inverse = transpose(this.orientation);

    return fromNotation(name, this.size).map((viewerMove) => {
      const localAxis = applyMatrix(inverse, UNIT[viewerMove.axis]);
      const axis = dominantAxis(localAxis);
      const sign = Math.sign(localAxis[AXIS_INDEX[axis]]);
      const row = sign * viewerMove.row;

      return {
        axis,
        row,
        layer: layerForRow(this.size, row),
        turns: sign * viewerMove.turns,
        name,
      };
    });
  }

  // A face is solved when every sticker facing it shares one name.
  isSolved() {
    const faces = new Map();

    this.pieces.forEach((piece) => {
      piece.stickers.forEach((sticker) => {
        const facing = applyMatrix(piece.orientation, sticker.normal).map((value) =>
          Math.round(value),
        );
        const key = facing.join(',');

        if (!faces.has(key)) faces.set(key, sticker.name);
        else if (faces.get(key) !== sticker.name) faces.set(key, false);
      });
    });

    return [...faces.values()].every((value) => value !== false);
  }

  orient(axis, turns) {
    this.orientation = multiply(rotationMatrix(axis, turns), this.orientation);
  }

  setOrientation(matrix) {
    this.orientation = matrix.slice();
  }

  snapshot() {
    return {
      size: this.size,
      pieces: this.pieces.map((piece) => ({
        name: piece.name,
        cell: [...piece.cell],
        orientation: [...piece.orientation],
      })),
    };
  }

  restore(snapshot) {
    this.size = snapshot.size;
    this.build();

    snapshot.pieces.forEach((data) => {
      const piece = this.byName.get(data.name);

      if (!piece) return;

      piece.cell = [...data.cell];
      piece.orientation = [...data.orientation];
    });
  }

  // Logical cell -> render position, matching the original world scale.
  toWorld(cell) {
    const center = (this.size - 1) / 2;

    return cell.map((value) => (value - center) / 3);
  }
}

export { Cube, multiply, applyMatrix, rotationMatrix };
