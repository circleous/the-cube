import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Keyboard } from './Keyboard.js';

function makeGame() {
  document.body.innerHTML = `
    <div class="ui__keys">
      <button class="keys__key" data-key="R">R</button>
      <button class="keys__key" data-key="shift" aria-pressed="false">Shift</button>
      <button class="keys__key" data-key="x">X</button>
    </div>`;

  return { controls: { notate: vi.fn(), rotate: vi.fn() } };
}

function pressPhysical(keyCode) {
  const event = new KeyboardEvent('keydown');

  Object.defineProperty(event, 'keyCode', { value: keyCode });
  window.dispatchEvent(event);
}

beforeEach(() => vi.restoreAllMocks());

describe('Keyboard', () => {
  it('turns a face from an on-screen keycap', () => {
    const game = makeGame();
    new Keyboard(game);

    document.querySelector('[data-key="R"]').click();

    expect(game.controls.notate).toHaveBeenCalledWith('R');
  });

  it('reverses a face while the on-screen Shift toggle is on', () => {
    const game = makeGame();
    new Keyboard(game);

    document.querySelector('[data-key="shift"]').click();
    document.querySelector('[data-key="R"]').click();

    expect(game.controls.notate).toHaveBeenCalledWith("R'");
  });

  it('reflects the on-screen Shift state through aria-pressed', () => {
    const game = makeGame();
    new Keyboard(game);

    const shift = document.querySelector('[data-key="shift"]');

    shift.click();
    expect(shift.getAttribute('aria-pressed')).toBe('true');

    shift.click();
    expect(shift.getAttribute('aria-pressed')).toBe('false');
  });

  it('rotates from an on-screen keycap, inverted while Shift is on', () => {
    const game = makeGame();
    new Keyboard(game);

    document.querySelector('[data-key="x"]').click();
    expect(game.controls.rotate).toHaveBeenCalledWith('x', -1);

    document.querySelector('[data-key="shift"]').click();
    document.querySelector('[data-key="x"]').click();
    expect(game.controls.rotate).toHaveBeenLastCalledWith('x', 1);
  });

  it('keeps the physical keyboard mapping', () => {
    const game = makeGame();
    new Keyboard(game);

    pressPhysical(82);
    expect(game.controls.notate).toHaveBeenCalledWith('R');

    pressPhysical(16);
    pressPhysical(82);
    expect(game.controls.notate).toHaveBeenLastCalledWith("R'");
  });
});
