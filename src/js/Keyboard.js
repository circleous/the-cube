// Input adapter: physical key codes and the on-screen keycaps both map to the same
// turns and rotations. The model owns turning notation into a local move, so the
// orientation math that used to live here is gone.

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

const Z = 90;

const FACE_KEYS = Object.values(FACES);
const ROTATION_KEYS = Object.values(ROTATIONS);

class Keyboard {
  constructor(game) {
    this.game = game;
    this.shift = false;
    this.enabled = false;

    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);

    window.addEventListener('keydown', this.keydown, false);
    window.addEventListener('keyup', this.keyup, false);

    this.initKeys();
  }

  // Input is only live once the game is actually playing; the menu, stats and
  // theme screens accept none of it. Mirrors `Controls.enable`/`disable`.
  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  // The on-screen keycaps share this map, so both inputs behave identically.
  initKeys() {
    this.keys = [...document.querySelectorAll('.keys__key')];
    this.shiftKey = this.keys.find((key) => key.dataset.key === 'shift');

    this.keys.forEach((key) => {
      key.addEventListener('click', () => this.press(key.dataset.key));
    });

    this.renderShift();
  }

  press(key) {
    if (this.enabled !== true) return;

    if (key === 'shift') {
      this.shift = !this.shift;
      this.renderShift();
    } else if (FACE_KEYS.includes(key)) {
      this.turn(key);
    } else if (ROTATION_KEYS.includes(key)) {
      this.rotate(key);
    }
  }

  turn(face) {
    const modifier = this.shift ? `'` : ``;

    this.game.controls.notate(face + modifier);
  }

  rotate(axis) {
    this.game.controls.rotate(axis, this.shift ? 1 : -1);
  }

  // The on-screen Shift is a toggle rather than a hold, so it must show its state.
  renderShift() {
    if (this.shiftKey) this.shiftKey.setAttribute('aria-pressed', String(this.shift));
  }

  keydown(e) {
    if (this.enabled !== true) return;

    if (e.keyCode === SHIFT) {
      this.shift = true;
      this.renderShift();
    }
    if (e.repeat) return;

    if ((e.metaKey || e.ctrlKey) && e.keyCode === Z) {
      e.preventDefault();
      this.game.controls.undo();
    } else if (FACES[e.keyCode]) {
      this.turn(FACES[e.keyCode]);
    } else if (ROTATIONS[e.keyCode]) {
      this.rotate(ROTATIONS[e.keyCode]);
    }
  }

  keyup(e) {
    if (e.keyCode === SHIFT) {
      this.shift = false;
      this.renderShift();
    }
  }
}

export { Keyboard };
