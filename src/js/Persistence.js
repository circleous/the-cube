// Persistence: the only module that knows the localStorage keys or the on-disk
// shape. Callers hand over whole values (a cube snapshot, the preference fields, the
// scores table) and never touch a key; the encoding lives here as private helpers.

const KEYS = {
  version: 'theCube_version',
  playing: 'theCube_playing',
  savedState: 'theCube_savedState',
  time: 'theCube_time',
  preferences: 'theCube_preferences',
  scores: 'theCube_scores',
};

class Persistence {
  constructor(game) {
    this.game = game;

    // Any version change discards the in-progress game and preferences; scores are
    // user data and survive.
    const version = localStorage.getItem(KEYS.version);

    if (!version || version !== window.gameVersion) {
      this.clearGame();
      this.clearPreferences();
      localStorage.setItem(KEYS.version, window.gameVersion);
    }
  }

  init() {
    this.loadPreferences();
    this.loadScores();
  }

  // --- game ------------------------------------------------------------------

  loadGame() {
    try {
      const snapshot = this.decodeGame();
      const gameTime = parseInt(localStorage.getItem(KEYS.time));

      if (snapshot.size !== this.game.cube.size) throw new Error();

      this.game.cube.restore(snapshot);
      this.game.cubeView.syncAll();

      this.game.timer.deltaTime = gameTime;
      this.game.saved = true;

      return true;
    } catch {
      this.game.saved = false;

      return false;
    }
  }

  saveGame() {
    localStorage.setItem(KEYS.playing, true);
    localStorage.setItem(KEYS.savedState, JSON.stringify(this.game.cube.snapshot()));
    localStorage.setItem(KEYS.time, this.game.timer.deltaTime);
  }

  saveTime(millis) {
    localStorage.setItem(KEYS.time, millis);
  }

  clearGame() {
    localStorage.removeItem(KEYS.playing);
    localStorage.removeItem(KEYS.savedState);
    localStorage.removeItem(KEYS.time);
  }

  decodeGame() {
    const playing = localStorage.getItem(KEYS.playing) === 'true';
    const time = localStorage.getItem(KEYS.time);

    if (!playing || time === null) throw new Error();

    const snapshot = JSON.parse(localStorage.getItem(KEYS.savedState));

    if (!snapshot) throw new Error();

    return snapshot;
  }

  // --- preferences -----------------------------------------------------------

  loadPreferences() {
    try {
      const preferences = JSON.parse(localStorage.getItem(KEYS.preferences));

      if (!preferences) throw new Error();

      this.applyPreferences(preferences);

      return true;
    } catch {
      this.applyPreferences({
        cubeSize: 3,
        flipConfig: 0,
        dificulty: 1,
        fov: 10,
        theme: 'cube',
        colors: null,
      });

      this.savePreferences();

      return false;
    }
  }

  applyPreferences(preferences) {
    const { game } = this;

    game.cube.size = parseInt(preferences.cubeSize);
    game.cubeView.flipConfig = parseInt(preferences.flipConfig);
    game.scrambler.dificulty = parseInt(preferences.dificulty);

    game.world.fov = parseFloat(preferences.fov);
    game.world.resize();

    if (preferences.colors) game.themes.colors = preferences.colors;
    game.themes.setTheme(preferences.theme);
  }

  savePreferences() {
    const { game } = this;

    localStorage.setItem(
      KEYS.preferences,
      JSON.stringify({
        cubeSize: game.cube.size,
        flipConfig: game.cubeView.flipConfig,
        dificulty: game.scrambler.dificulty,
        fov: game.world.fov,
        theme: game.themes.theme,
        colors: game.themes.colors,
      }),
    );
  }

  clearPreferences() {
    localStorage.removeItem(KEYS.preferences);
  }

  // --- scores ----------------------------------------------------------------

  loadScores() {
    try {
      const scores = JSON.parse(localStorage.getItem(KEYS.scores));

      if (!scores) throw new Error();

      this.game.scores.data = scores;
    } catch {}
  }

  saveScores() {
    localStorage.setItem(KEYS.scores, JSON.stringify(this.game.scores.data));
  }

  clearScores() {
    localStorage.removeItem(KEYS.scores);
  }
}

export { Persistence, KEYS };
