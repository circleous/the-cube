import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cube } from './Cube.js';
import { Persistence, KEYS } from './Persistence.js';

const VERSION = 'test-version';

function scores() {
  return {
    2: { scores: [], solves: 0, best: 0, worst: 0 },
    3: { scores: [], solves: 0, best: 0, worst: 0 },
    4: { scores: [], solves: 0, best: 0, worst: 0 },
    5: { scores: [], solves: 0, best: 0, worst: 0 },
  };
}

function makeGame(model = new Cube(3)) {
  const themes = {
    theme: 'cube',
    colors: { P: 0x08101a, U: 0xffffff },
    setTheme(theme) {
      if (theme) this.theme = theme;
    },
  };

  return {
    cube: model,
    cubeView: { flipConfig: 0, syncAll: vi.fn() },
    timer: { deltaTime: 0 },
    scores: { data: scores() },
    world: { fov: 10, resize: vi.fn() },
    themes,
    scrambler: { dificulty: 1 },
    saved: false,
  };
}

beforeEach(() => {
  localStorage.clear();
  window.gameVersion = VERSION;
});

describe('Persistence', () => {
  it('stamps the version on first run', () => {
    makeGame();
    new Persistence(makeGame());

    expect(localStorage.getItem(KEYS.version)).toBe(VERSION);
  });

  it('discards the game and preferences on a version change but keeps scores', () => {
    const game = makeGame();

    localStorage.setItem(KEYS.version, 'older');
    localStorage.setItem(KEYS.playing, 'true');
    localStorage.setItem(KEYS.savedState, JSON.stringify({ size: 3, pieces: [] }));
    localStorage.setItem(KEYS.preferences, JSON.stringify({ cubeSize: 3 }));
    game.scores.data[3].solves = 7;
    localStorage.setItem(KEYS.scores, JSON.stringify(game.scores.data));

    const persistence = new Persistence(game);
    persistence.init();

    expect(localStorage.getItem(KEYS.savedState)).toBeNull();
    expect(localStorage.getItem(KEYS.preferences)).not.toBeNull(); // re-saved with defaults
    expect(game.scores.data[3].solves).toBe(7);
    expect(localStorage.getItem(KEYS.version)).toBe(VERSION);
  });

  it('round-trips an in-progress game', () => {
    const game = makeGame();

    game.cube.applyNotation('R');
    game.cube.applyNotation('U');
    game.timer.deltaTime = 1234;

    new Persistence(game).saveGame();

    const restored = makeGame();
    const loaded = new Persistence(restored).loadGame();

    expect(loaded).toBe(true);
    expect(restored.saved).toBe(true);
    expect(restored.timer.deltaTime).toBe(1234);
    expect(restored.cube.snapshot()).toEqual(game.cube.snapshot());
    expect(restored.cubeView.syncAll).toHaveBeenCalledOnce();
  });

  it('rejects a saved game whose size does not match', () => {
    const game = makeGame();

    new Persistence(game).saveGame();

    const restored = makeGame(new Cube(4));
    const loaded = new Persistence(restored).loadGame();

    expect(loaded).toBe(false);
    expect(restored.saved).toBe(false);
  });

  it('persists elapsed time through saveTime', () => {
    const game = makeGame();
    const persistence = new Persistence(game);

    persistence.saveTime(4321);

    expect(new Persistence(makeGame()).loadGame()).toBe(false); // no snapshot, but time written
    expect(localStorage.getItem(KEYS.time)).toBe('4321');
  });

  it('round-trips preferences', () => {
    const game = makeGame();

    game.cubeView.flipConfig = 2;
    game.scrambler.dificulty = 2;
    game.world.fov = 20;
    game.themes.theme = 'rain';

    new Persistence(game).savePreferences();

    const restored = makeGame();
    new Persistence(restored).loadPreferences();

    expect(restored.cubeView.flipConfig).toBe(2);
    expect(restored.scrambler.dificulty).toBe(2);
    expect(restored.world.fov).toBe(20);
    expect(restored.themes.theme).toBe('rain');
  });

  it('round-trips scores', () => {
    const game = makeGame();

    game.scores.data[3].solves = 3;
    game.scores.data[3].best = 111;

    new Persistence(game).saveScores();

    const restored = makeGame();
    new Persistence(restored).loadScores();

    expect(restored.scores.data[3]).toEqual({ scores: [], solves: 3, best: 111, worst: 0 });
  });
});
