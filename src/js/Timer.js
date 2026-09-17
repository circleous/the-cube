import { Animation } from './Animation.js';
import { formatTime } from './formatTime.js';

class Timer extends Animation {
  constructor(game) {
    super(false);

    this.game = game;
    this.onTick = () => {};
    this.reset();
  }

  start(continueGame) {
    this.startTime = continueGame ? Date.now() - this.deltaTime : Date.now();
    this.deltaTime = 0;
    this.converted = this.convert();

    super.start();
  }

  reset() {
    this.startTime = 0;
    this.currentTime = 0;
    this.deltaTime = 0;
    this.converted = '0:00';
  }

  stop() {
    this.currentTime = Date.now();
    this.deltaTime = this.currentTime - this.startTime;
    this.convert();

    super.stop();

    return { time: this.converted, millis: this.deltaTime };
  }

  update() {
    const old = this.converted;

    this.currentTime = Date.now();
    this.deltaTime = this.currentTime - this.startTime;
    this.convert();

    if (this.converted != old) {
      this.onTick(this.deltaTime);
      this.setText();
    }
  }

  convert() {
    this.converted = formatTime(this.deltaTime);
  }

  setText() {
    this.game.dom.texts.timer.innerHTML = this.converted;
  }
}

export { Timer };
