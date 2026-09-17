import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Preferences } from './Preferences.js';

function makeGame() {
  document.body.innerHTML = '<div id="prefs"></div><div id="theme"></div>';

  return {
    dom: {
      prefs: document.querySelector('#prefs'),
      theme: document.querySelector('#theme'),
    },
    cube: { size: 3 },
    cubeView: { flipConfig: 0 },
    scrambler: {
      dificulty: 0,
      scrambleLength: { 2: [7, 9, 11], 3: [20, 25, 30], 4: [30, 40, 50], 5: [40, 60, 80] },
    },
    world: { fov: 10, resize: vi.fn() },
    themes: { theme: 'cube', setTheme: vi.fn() },
    themeEditor: { updateHSL: vi.fn() },
    persistence: { savePreferences: vi.fn() },
  };
}

function init() {
  const game = makeGame();
  const preferences = new Preferences(game);

  preferences.init();

  return { game, preferences };
}

const labelsIn = (selector) =>
  [...document.querySelectorAll(`${selector} .range__list div`)].map((item) => item.innerHTML);

beforeEach(() => vi.restoreAllMocks());

describe('Preferences', () => {
  it('declares every setting and renders it into the right panel', () => {
    const { preferences } = init();

    expect(Object.keys(preferences.ranges).sort()).toEqual(
      ['flip', 'fov', 'hue', 'lightness', 'saturation', 'scramble', 'size', 'theme'].sort(),
    );
    expect(document.querySelectorAll('#prefs .range')).toHaveLength(5);
    expect(document.querySelectorAll('#theme .range')).toHaveLength(3);
  });

  it('derives the scramble labels from the cube size', () => {
    const { preferences } = init();

    expect(labelsIn('.range[name="scramble"]')).toEqual(['20', '25', '30']);

    preferences.ranges.size.onUpdate(4);

    expect(labelsIn('.range[name="scramble"]')).toEqual(['30', '40', '50']);
  });

  it('maps the theme index to a theme name', () => {
    const { game, preferences } = init();

    preferences.ranges.theme.onUpdate(4);

    expect(game.themes.setTheme).toHaveBeenCalledWith('rain');
  });

  it('applies the widget value to its domain field', () => {
    const { game, preferences } = init();

    preferences.ranges.flip.onUpdate(2);
    preferences.ranges.size.onUpdate(5);

    expect(game.cubeView.flipConfig).toBe(2);
    expect(game.cube.size).toBe(5);
  });

  it('keeps fov continuous and the colors delegated to the theme editor', () => {
    const { game, preferences } = init();

    expect(preferences.ranges.fov.step).toBe(0);

    preferences.ranges.fov.setValue(12.5);
    expect(preferences.ranges.fov.value).toBe(12.5);

    preferences.ranges.hue.onUpdate(120);
    expect(game.themeEditor.updateHSL).toHaveBeenCalledOnce();
  });

  it('saves preferences when a setting settles', () => {
    const { game, preferences } = init();

    preferences.ranges.size.onComplete(3);

    expect(game.persistence.savePreferences).toHaveBeenCalledOnce();
  });

  it('snaps to the step and pins the handle position', () => {
    const { preferences } = init();

    preferences.ranges.size.setValue(2.4);
    expect(preferences.ranges.size.value).toBe(2);

    preferences.ranges.size.setValue(5);
    expect(preferences.ranges.size.handle.style.left).toBe('100%');
  });
});
