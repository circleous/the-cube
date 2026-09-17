import { Draggable } from './Draggable.js';

// A dumb slider widget. It owns value <-> handle-position maths and pointer drag,
// emits the value it settles on, and knows nothing about what a value means. The
// setting declarations in `Preferences` build it and interpret its values.

const RangeHTML = [
  '<div class="range">',
  '<div class="range__label"></div>',
  '<div class="range__track">',
  '<div class="range__track-line"></div>',
  '<div class="range__handle"><div></div></div>',
  '</div>',
  '<div class="range__list"></div>',
  '</div>',
].join('\n');

function createRange({ name, title, labels = [], color = false }) {
  const template = document.createElement('div');

  template.innerHTML = RangeHTML;

  const element = template.firstElementChild;
  const list = element.querySelector('.range__list');

  element.setAttribute('name', name);
  element.querySelector('.range__label').innerHTML = title;

  if (color) element.classList.add('range--type-color', `range--color-${name}`);

  labels.forEach((text) => {
    const item = document.createElement('div');

    item.innerHTML = text;
    list.appendChild(item);
  });

  return element;
}

class Range {
  constructor(element, options = {}) {
    this.element = element;
    this.track = element.querySelector('.range__track');
    this.handle = element.querySelector('.range__handle');
    this.list = [...element.querySelectorAll('.range__list div')];

    this.value = options.value ?? 0;
    this.min = options.range ? options.range[0] : 0;
    this.max = options.range ? options.range[1] : 1;
    this.step = options.step ?? 0;

    this.onUpdate = options.onUpdate ?? (() => {});
    this.onComplete = options.onComplete ?? (() => {});

    this.setValue(this.value);
    this.initDraggable();
  }

  setValue(value) {
    this.value = this.round(this.limitValue(value));
    this.setHandlePosition();
  }

  setLabels(labels) {
    this.list.forEach((item, index) => {
      item.innerHTML = labels[index] ?? '';
    });
  }

  initDraggable() {
    let current;

    this.draggable = new Draggable(this.handle, { calcDelta: true });

    this.draggable.onDragStart = () => {
      current = this.positionFromValue(this.value);
      this.handle.style.left = current + 'px';
    };

    this.draggable.onDragMove = (position) => {
      current = this.limitPosition(current + position.delta.x);
      this.value = this.round(this.valueFromPosition(current));
      this.setHandlePosition();

      this.onUpdate(this.value);
    };

    this.draggable.onDragEnd = () => {
      this.onComplete(this.value);
    };
  }

  round(value) {
    if (this.step < 1) return value;

    return Math.round((value - this.min) / this.step) * this.step + this.min;
  }

  limitValue(value) {
    const max = Math.max(this.max, this.min);
    const min = Math.min(this.max, this.min);

    return Math.min(Math.max(value, min), max);
  }

  limitPosition(position) {
    return Math.min(Math.max(position, 0), this.track.offsetWidth);
  }

  percentsFromValue(value) {
    return (value - this.min) / (this.max - this.min);
  }

  valueFromPosition(position) {
    return this.min + (this.max - this.min) * (position / this.track.offsetWidth);
  }

  positionFromValue(value) {
    return this.percentsFromValue(value) * this.track.offsetWidth;
  }

  setHandlePosition() {
    this.handle.style.left = this.percentsFromValue(this.value) * 100 + '%';
  }
}

export { Range, createRange };
