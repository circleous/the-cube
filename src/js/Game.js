import { World } from './World.js';
import { Cube } from './Cube.js';
import { CubeView } from './CubeView.js';
import { Controls } from './Controls.js';
import { Scrambler } from './Scrambler.js';
import { Transition } from './Transition.js';
import { Timer } from './Timer.js';
import { Preferences } from './Preferences.js';
import { Confetti } from './Confetti.js';
import { Scoreboard } from './Scoreboard.js';
import { renderStats } from './ScoreboardView.js';
import { Persistence } from './Persistence.js';
import { Themes } from './Themes.js';
import { ThemeEditor } from './ThemeEditor.js';
import { States } from './States.js';
import { Keyboard } from './Keyboard.js';
import { ScreenFlow } from './ScreenFlow.js';

import { registerServiceWorker } from './ServiceWorker.js';

// Composition root: it builds the modules, connects input to the screen flow, and
// supplies the flow with the game effects it triggers. The screen rules and their
// timing live in `ScreenFlow`; nothing here calls `Transition` directly.
class Game {
  constructor() {
    this.dom = {
      ui: document.querySelector('.ui'),
      game: document.querySelector('.ui__game'),
      back: document.querySelector('.ui__background'),
      prefs: document.querySelector('.ui__prefs'),
      theme: document.querySelector('.ui__theme'),
      stats: document.querySelector('.ui__stats'),
      texts: {
        title: document.querySelector('.text--title'),
        note: document.querySelector('.text--note'),
        timer: document.querySelector('.text--timer'),
        complete: document.querySelector('.text--complete'),
        best: document.querySelector('.text--best-time'),
        theme: document.querySelector('.text--theme'),
      },
      buttons: {
        prefs: document.querySelector('.btn--prefs'),
        back: document.querySelector('.btn--back'),
        stats: document.querySelector('.btn--stats'),
        reset: document.querySelector('.btn--reset'),
        theme: document.querySelector('.btn--theme'),
      },
    };

    this.world = new World(this);
    this.cube = new Cube(3);
    this.cubeView = new CubeView(this, this.cube);
    this.controls = new Controls(this);
    this.keyboard = new Keyboard(this);
    this.scrambler = new Scrambler(this);
    this.transition = new Transition(this);
    this.timer = new Timer(this);
    this.preferences = new Preferences(this);
    this.scoreboard = new Scoreboard();
    this.persistence = new Persistence(this);
    this.confetti = new Confetti(this);
    this.themes = new Themes(this);
    this.themeEditor = new ThemeEditor(this);

    this.timer.onTick = (millis) => this.persistence.saveTime(millis);

    this.flow = new ScreenFlow(this.transition, this.createHandlers());

    this.newGame = false;
    this.saved = false;

    this.initActions();

    this.persistence.init();
    this.preferences.init();
    this.cubeView.build();
    this.transition.init();

    this.persistence.loadGame();
    this.renderStats();

    setTimeout(() => this.flow.start(), 500);
  }

  renderStats() {
    renderStats(this.dom.stats, {
      size: this.cube.size,
      stats: this.scoreboard.stats(this.cube.size),
    });
  }

  // The effects the screen flow triggers. The flow knows the order and timing;
  // these know the game.
  createHandlers() {
    return {
      onScramble: () => {
        if (!this.saved) {
          this.scrambler.generate({ size: this.cube.size });
          this.controls.scrambleCube();
          this.newGame = true;
        }

        const duration = this.saved
          ? 0
          : this.scrambler.sequence.length * (this.cubeView.flipSpeeds[0] + 10);

        this.saved = true;

        return duration;
      },

      onPlayReady: () => {
        this.controls.enable();
        if (!this.newGame) this.timer.start(true);
      },

      onPlayExit: () => {
        this.controls.disable();
        if (!this.newGame) this.timer.stop();
      },

      onPrefsExit: () => this.cubeView.resize(),

      onStatsEnter: () => this.renderStats(),

      onThemeEnter: () => {
        this.themeEditor.colorPicker(true);

        this.cube.restore(States['3']['checkerboard']);
        this.cubeView.syncAll();

        this.themeEditor.setHSL(null, false);
      },

      onThemeExit: () => this.themeEditor.colorPicker(false),

      onThemeRestoreCube: () => {
        if (!this.persistence.loadGame()) this.cubeView.resize(true);
      },

      onThemeReset: () => this.themeEditor.resetTheme(),

      onSolve: () => {
        this.saved = false;

        this.controls.disable();
        this.timer.stop();
        this.persistence.clearGame();

        return this.scoreboard.add(this.cube.size, this.timer.deltaTime).improved;
      },

      onCelebrate: () => this.confetti.start(),

      onCompleteExit: () => {
        this.saved = false;
        this.timer.reset();
      },

      onCompleteCleanup: () => {
        this.cube.build();
        this.cubeView.reset();
        this.cubeView.syncAll();
        this.confetti.stop();
      },
    };
  }

  initActions() {
    let tappedTwice = false;

    this.dom.game.addEventListener(
      'click',
      () => {
        if (this.flow.busy) return;
        if (this.flow.screen === 'playing') return;

        if (this.flow.screen === 'menu') {
          if (!tappedTwice) {
            tappedTwice = true;
            setTimeout(() => (tappedTwice = false), 300);
            return false;
          }

          this.flow.go('playing');
        } else if (this.flow.screen === 'complete') {
          this.flow.go('stats');
        } else if (this.flow.screen === 'stats') {
          this.flow.back();
        }
      },
      false,
    );

    this.controls.onMove = () => {
      if (this.newGame) {
        this.timer.start(true);
        this.newGame = false;
      }
    };

    this.dom.buttons.back.onclick = () => this.flow.back();

    this.dom.buttons.reset.onclick = () => {
      if (this.flow.screen === 'theme') this.flow.resetTheme();
    };

    this.dom.buttons.prefs.onclick = () => this.flow.go('prefs');

    this.dom.buttons.theme.onclick = () => this.flow.go('theme');

    this.dom.buttons.stats.onclick = () => this.flow.go('stats');

    this.controls.onSolved = () => this.flow.go('complete');
  }
}

window.game = new Game();

registerServiceWorker();
