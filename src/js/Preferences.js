import { Range, createRange } from './Range.js';

// Every setting is declared once, here: its panel, label, range, how to read it from
// the game, and how to apply a new value. The widget markup is generated from these
// declarations, so the options and the domain fields can no longer drift apart.

const THEMES = ['cube', 'erno', 'dust', 'camo', 'rain'];

const SETTINGS = [
  {
    name: 'size',
    panel: 'prefs',
    title: 'Cube Size',
    range: [2, 5],
    step: 1,
    labels: ['2', '3', '4', '5'],
    value: (game) => game.cube.size,
    apply: (game, value) => {
      game.cube.size = value;
    },
  },
  {
    name: 'flip',
    panel: 'prefs',
    title: 'Flip Type',
    range: [0, 2],
    step: 1,
    labels: ['Swift&nbsp;', 'Smooth', 'Bounce'],
    value: (game) => game.cubeView.flipConfig,
    apply: (game, value) => {
      game.cubeView.flipConfig = value;
    },
  },
  {
    name: 'scramble',
    panel: 'prefs',
    title: 'Scramble Length',
    range: [0, 2],
    step: 1,
    labels: (game) => game.scrambler.scrambleLength[game.cube.size],
    value: (game) => game.scrambler.dificulty,
    apply: (game, value) => {
      game.scrambler.dificulty = value;
    },
  },
  {
    name: 'fov',
    panel: 'prefs',
    title: 'Camera Angle',
    // Continuous: the two labels are decorative, the camera is always perspective.
    range: [2, 45],
    labels: ['Ortographic', 'Perspective'],
    value: (game) => game.world.fov,
    apply: (game, value) => {
      game.world.fov = value;
      game.world.resize();
    },
  },
  {
    name: 'theme',
    panel: 'prefs',
    title: 'Color Scheme',
    range: [0, 4],
    step: 1,
    labels: ['Cube', 'Erno', 'Dust', 'Camo', 'Rain'],
    value: (game) => THEMES.indexOf(game.themes.theme),
    apply: (game, value) => {
      game.themes.setTheme(THEMES[value]);
    },
  },
  {
    name: 'hue',
    panel: 'theme',
    title: 'Hue',
    color: true,
    range: [0, 360],
    value: () => 0,
    apply: (game) => game.themeEditor.updateHSL(),
  },
  {
    name: 'saturation',
    panel: 'theme',
    title: 'Saturation',
    color: true,
    range: [0, 100],
    value: () => 100,
    apply: (game) => game.themeEditor.updateHSL(),
  },
  {
    name: 'lightness',
    panel: 'theme',
    title: 'Lightness',
    color: true,
    range: [0, 100],
    value: () => 50,
    apply: (game) => game.themeEditor.updateHSL(),
  },
];

class Preferences {
  constructor(game) {
    this.game = game;
    this.ranges = {};
  }

  init() {
    this.build('prefs', this.game.dom.prefs);
    this.build('theme', this.game.dom.theme);
    this.updateLabels();
  }

  build(panel, container) {
    container.innerHTML = '';

    SETTINGS.filter((spec) => spec.panel === panel).forEach((spec) => {
      const element = createRange({
        name: spec.name,
        title: spec.title,
        color: spec.color,
        labels: this.labelsFor(spec),
      });

      container.appendChild(element);

      this.ranges[spec.name] = new Range(element, {
        value: spec.value(this.game),
        range: spec.range,
        step: spec.step,
        onUpdate: (value) => {
          spec.apply(this.game, value);
          this.updateLabels();
        },
        onComplete: () => this.game.persistence.savePreferences(),
      });
    });
  }

  labelsFor(spec) {
    return typeof spec.labels === 'function' ? spec.labels(this.game) : (spec.labels ?? []);
  }

  // Labels can depend on other settings (scramble length follows cube size), so
  // re-evaluate them whenever a value changes.
  updateLabels() {
    SETTINGS.forEach((spec) => {
      if (!spec.labels) return;

      this.ranges[spec.name]?.setLabels(this.labelsFor(spec));
    });
  }
}

export { Preferences, SETTINGS };
