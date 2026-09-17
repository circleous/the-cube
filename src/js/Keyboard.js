// Thin adapter: key codes to move notation. The model owns turning notation into a
// local move, so the orientation math that used to live here is gone.

const SHIFT = 16;

const FACES = {
  82: 'R',
  76: 'L',
  85: 'U',
  68: 'D',
  70: 'F',
  66: 'B',
};

const ROTATIONS = {
  88: 'x',
  89: 'y',
  90: 'z',
};

class Keyboard {
  constructor(game) {
    this.game = game;
    this.shift = false;

    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);

    window.addEventListener('keydown', this.keydown, false);
    window.addEventListener('keyup', this.keyup, false);
  }

  keydown(e) {
    if (e.keyCode === SHIFT) this.shift = true;
    if (e.repeat) return;

    if (FACES[e.keyCode]) {
      const modifier = this.shift ? `'` : ``;

      this.game.controls.notate(FACES[e.keyCode] + modifier);
    } else if (ROTATIONS[e.keyCode]) {
      this.game.controls.rotate(ROTATIONS[e.keyCode], this.shift ? 1 : -1);
    }
  }

  keyup(e) {
    if (e.keyCode === SHIFT) this.shift = false;
  }
}

export { Keyboard };
