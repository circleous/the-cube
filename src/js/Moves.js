// Move vocabulary for the puzzle. A move is a signed quarter-turn count about one
// axis, applied to a single layer, with the printable notation kept for display and
// persistence.
//
// This is the one shape the scrambler, the keyboard and the controls all build; it
// replaces the three separate `{ position, axis, angle }` pipelines.

const FACE_AXIS = { L: 'x', R: 'x', D: 'y', U: 'y', B: 'z', F: 'z' };
const FACE_SIGN = { L: -1, R: 1, D: -1, U: 1, B: -1, F: 1 };

const AXIS_INDEX = { x: 0, y: 1, z: 2 };

// Which grid layer a signed row selects. `row` magnitudes come from face notation:
// on 4x4 and 5x5 an uppercase face selects row 2 (the outer layer) and a lowercase
// face selects row 1 (the inner layer); on 2x2 and 3x3 the single layer is the outer
// one. This reproduces the original layer mapping, including the odd coupling where
// the row magnitude doubles the turn angle on wide sizes (see `fromNotation`).
function layerForRow(size, row) {
  const sign = Math.sign(row);
  const magnitude = Math.abs(row);

  if (size <= 3) return sign > 0 ? size - 1 : 0;
  if (magnitude === 2) return sign > 0 ? size - 1 : 0;
  return sign > 0 ? size - 2 : 1;
}

// Parse notation (`R`, `U'`, `F2`, `Uu`) into the moves it applies. A `2` modifier
// yields two identical moves, because the original animation plays each quarter
// turn as its own tween; collapsing them would change the scramble visuals.
function fromNotation(name, size) {
  const face = name[0];
  const upper = face.toUpperCase();
  const modifier = name[1];

  const axis = FACE_AXIS[upper];
  const sign = FACE_SIGN[upper];

  const wide = size > 3 && face !== upper;
  const magnitude = size > 3 && !wide ? 2 : 1;
  const row = sign * magnitude;

  const turns = -row * (modifier === "'" ? -1 : 1);
  const move = { axis, row, layer: layerForRow(size, row), turns, name };

  return modifier === '2' ? [move, { ...move }] : [move];
}

export { FACE_AXIS, FACE_SIGN, AXIS_INDEX, layerForRow, fromNotation };
