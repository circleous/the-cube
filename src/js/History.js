// Bounded record of the player's most recent layer moves. Undo only needs each
// move's inverse: a signed quarter-turn about one axis on one layer. Scrambles
// and undos are never recorded, so this holds exactly what the player can take
// back, and the oldest moves fall off the end.
const LIMIT = 5;

class History {
  constructor(limit = LIMIT) {
    this.limit = limit;
    this.moves = [];
  }

  record(move) {
    this.moves.push({ axis: move.axis, layer: move.layer, turns: move.turns });

    if (this.moves.length > this.limit) this.moves.shift();
  }

  // The inverse of the move to take back, or null when there is nothing left.
  popInverse() {
    const move = this.moves.pop();

    return move ? { axis: move.axis, layer: move.layer, turns: -move.turns } : null;
  }

  clear() {
    this.moves.length = 0;
  }
}

export { History, LIMIT };
