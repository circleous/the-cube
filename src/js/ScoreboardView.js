import { formatTime } from './formatTime.js';

// The stats panel renderer. A plain function: read the values from `Scoreboard`
// and write the rows. Absent values show as `-`, matching the original.
function renderStats(container, { size, stats }) {
  const set = (name, value) => {
    container.querySelector(`.stats[name="${name}"] b`).innerHTML = value;
  };

  const time = (value) => (value > 0 ? formatTime(value) : '-');

  set('cube-size', `${size}<i>x</i>${size}<i>x</i>${size}`);
  set('total-solves', stats.solves || '-');
  set('best-time', time(stats.best));
  set('worst-time', time(stats.worst));
  set('average-5', time(stats.average5));
  set('average-12', time(stats.average12));
  set('average-25', time(stats.average25));
}

export { renderStats };
