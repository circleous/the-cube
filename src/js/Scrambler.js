import { fromNotation } from './Moves.js';

// Turns a size and difficulty into a random sequence of moves. Pure: no scene, no
// DOM, and an injectable rng so a seeded generator makes the output testable.
class Scrambler {
  constructor() {
    this.dificulty = 0;

    this.scrambleLength = {
      2: [7, 9, 11],
      3: [20, 25, 30],
      4: [30, 40, 50],
      5: [40, 60, 80],
    };

    this.moves = [];
    this.sequence = [];
    this.print = '';
  }

  generate({ size, difficulty = this.dificulty, rng = Math.random } = {}) {
    const length = this.scrambleLength[size][difficulty];
    const faces = size < 4 ? 'UDLRFB' : 'UuDdLlRrFfBb';
    const modifiers = ['', "'", '2'];
    const moves = [];

    while (moves.length < length) {
      const move = faces[Math.floor(rng() * faces.length)] + modifiers[Math.floor(rng() * 3)];

      if (moves.length > 0 && move[0] === moves[moves.length - 1][0]) continue;
      if (moves.length > 1 && move[0] === moves[moves.length - 2][0]) continue;

      moves.push(move);
    }

    this.moves = moves;
    this.print = moves.join(' ');
    this.sequence = moves.flatMap((move) => fromNotation(move, size));

    return this;
  }
}

export { Scrambler };
