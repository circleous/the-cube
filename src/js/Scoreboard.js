// Pure scoring: solve times per cube size, with best/worst and rolling averages.
// Returns values and never touches storage or the DOM; the caller persists the
// `data` table and `ScoreboardView` renders `stats()`.

function emptyTable() {
  const entry = () => ({ scores: [], solves: 0, best: 0, worst: 0 });

  return { 2: entry(), 3: entry(), 4: entry(), 5: entry() };
}

class Scoreboard {
  constructor() {
    this.data = emptyTable();
  }

  add(size, time) {
    const data = this.data[size];

    data.scores.push(time);
    data.solves++;

    if (data.scores.length > 100) data.scores.shift();

    const improved = time < data.best || data.best === 0;

    if (improved) data.best = time;
    if (time > data.worst) data.worst = time;

    return { improved };
  }

  stats(size) {
    const data = this.data[size];

    return {
      solves: data.solves,
      best: data.best,
      worst: data.worst,
      average5: this.average(size, 5),
      average12: this.average(size, 12),
      average25: this.average(size, 25),
    };
  }

  average(size, count) {
    const data = this.data[size];

    if (data.scores.length < count) return 0;

    return data.scores.slice(-count).reduce((a, b) => a + b, 0) / count;
  }
}

export { Scoreboard, emptyTable };
