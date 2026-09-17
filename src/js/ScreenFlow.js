// The screen flow: the one place that knows which screen may follow which, where
// "back" goes, and how long each transition takes. The visual choreography stays in
// `Transition` (now only reachable from here); the game effects are injected as
// `handlers`, so this module owns transition *rules* rather than the whole game.

const SCREENS = {
  Menu: 'menu',
  Playing: 'playing',
  Complete: 'complete',
  Stats: 'stats',
  Prefs: 'prefs',
  Theme: 'theme',
};

const BUTTONS = {
  menu: ['stats', 'prefs'],
  playing: ['back'],
  complete: [],
  stats: [],
  prefs: ['back', 'theme'],
  theme: ['back', 'reset'],
  none: [],
};

// Legal edges between screens.
const EDGES = {
  menu: ['playing', 'stats', 'prefs'],
  playing: ['menu', 'complete'],
  complete: ['stats'],
  stats: ['menu'],
  prefs: ['menu', 'theme'],
  theme: ['prefs'],
};

// Where `back()` goes. Complete has no back target: it advances to Stats.
const BACK = { playing: 'menu', stats: 'menu', prefs: 'menu', theme: 'prefs' };

const SHOW = true;
const HIDE = false;

class ScreenFlow {
  constructor(transition, handlers) {
    this.transition = transition;
    this.handlers = handlers;

    this.screen = SCREENS.Menu;
    this.bestTime = false;

    const routines = {
      'menu->playing': () => {
        const duration = this.handlers.onScramble();

        this.transition.buttons(BUTTONS.none, BUTTONS.menu);
        this.transition.zoom(true, duration);
        this.transition.title(HIDE);

        setTimeout(() => {
          this.transition.timer(SHOW);
          this.transition.buttons(BUTTONS.playing, BUTTONS.none);
        }, this.transition.durations.zoom - 1000);

        setTimeout(() => {
          this.handlers.onPlayReady();
        }, this.transition.durations.zoom);
      },

      'playing->menu': () => {
        this.transition.buttons(BUTTONS.menu, BUTTONS.playing);
        this.transition.zoom(false, 0);

        this.handlers.onPlayExit();

        this.transition.timer(HIDE);

        setTimeout(() => this.transition.title(SHOW), this.transition.durations.zoom - 1000);
      },

      'menu->stats': () => {
        this.transition.buttons(BUTTONS.stats, BUTTONS.menu);
        this.transition.title(HIDE);
        this.transition.cube(HIDE);

        setTimeout(() => {
          this.handlers.onStatsEnter();
          this.transition.stats(SHOW);
        }, 1000);
      },

      'stats->menu': () => {
        this.transition.buttons(BUTTONS.menu, BUTTONS.none);
        this.transition.stats(HIDE);

        setTimeout(() => this.transition.cube(SHOW), 500);
        setTimeout(() => this.transition.title(SHOW), 1200);
      },

      'menu->prefs': () => {
        this.transition.buttons(BUTTONS.prefs, BUTTONS.menu);
        this.transition.title(HIDE);
        this.transition.cube(HIDE);

        setTimeout(() => this.transition.preferences(SHOW), 1000);
      },

      'prefs->menu': () => {
        this.handlers.onPrefsExit();

        this.transition.buttons(BUTTONS.menu, BUTTONS.prefs);
        this.transition.preferences(HIDE);

        setTimeout(() => this.transition.cube(SHOW), 500);
        setTimeout(() => this.transition.title(SHOW), 1200);
      },

      'prefs->theme': () => {
        this.handlers.onThemeEnter();

        this.transition.buttons(BUTTONS.theme, BUTTONS.prefs);
        this.transition.preferences(HIDE);

        setTimeout(() => this.transition.cube(SHOW, true), 500);
        setTimeout(() => this.transition.theming(SHOW), 1000);
      },

      'theme->prefs': () => {
        this.handlers.onThemeExit();

        this.transition.buttons(BUTTONS.prefs, BUTTONS.theme);
        this.transition.cube(HIDE, true);
        this.transition.theming(HIDE);

        setTimeout(() => this.transition.preferences(SHOW), 1000);
        setTimeout(() => this.handlers.onThemeRestoreCube(), 1500);
      },

      'playing->complete': () => {
        this.transition.buttons(BUTTONS.complete, BUTTONS.playing);

        this.bestTime = this.handlers.onSolve();

        this.transition.zoom(false, 0);
        this.transition.elevate(SHOW);

        setTimeout(() => {
          this.transition.complete(SHOW, this.bestTime);
          this.handlers.onCelebrate();
        }, 1000);
      },

      'complete->stats': () => {
        this.handlers.onCompleteExit();

        this.transition.timer(HIDE);
        this.transition.complete(HIDE, this.bestTime);
        this.transition.cube(HIDE);

        setTimeout(() => {
          this.handlers.onCompleteCleanup();
          this.handlers.onStatsEnter();
          this.transition.stats(SHOW);
          this.transition.elevate(0);
        }, 1000);
      },
    };

    this.routines = routines;
  }

  get busy() {
    return this.transition.activeTransitions > 0;
  }

  canGo(screen) {
    return EDGES[this.screen].includes(screen);
  }

  // The first menu presentation.
  start() {
    this.transition.float();
    this.transition.cube(SHOW);

    setTimeout(() => this.transition.title(SHOW), 700);
    setTimeout(() => this.transition.buttons(BUTTONS.menu, BUTTONS.none), 1000);
  }

  go(screen) {
    if (screen === this.screen) return false;
    if (this.busy) return false;
    if (!this.canGo(screen)) return false;

    const from = this.screen;

    this.screen = screen;
    this.routines[`${from}->${screen}`]?.call(this);

    return true;
  }

  back() {
    const target = BACK[this.screen];

    if (!target) return false;

    return this.go(target);
  }

  resetTheme() {
    this.handlers.onThemeReset();
  }
}

export { ScreenFlow, SCREENS, BUTTONS };
