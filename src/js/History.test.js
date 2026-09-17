import { describe, expect, it } from 'vitest';

import { History } from './History.js';

describe('History', () => {
  it('returns the inverse of the last recorded move', () => {
    const history = new History();

    history.record({ axis: 'x', layer: 2, turns: -1 });

    expect(history.popInverse()).toEqual({ axis: 'x', layer: 2, turns: 1 });
  });

  it('pops most recent first', () => {
    const history = new History();

    history.record({ axis: 'x', layer: 2, turns: -1 });
    history.record({ axis: 'y', layer: 0, turns: 1 });

    expect(history.popInverse()).toEqual({ axis: 'y', layer: 0, turns: -1 });
    expect(history.popInverse()).toEqual({ axis: 'x', layer: 2, turns: 1 });
  });

  it('returns null when empty', () => {
    expect(new History().popInverse()).toBeNull();
  });

  it('drops the oldest move past the limit', () => {
    const history = new History(2);

    history.record({ axis: 'x', layer: 0, turns: 1 });
    history.record({ axis: 'x', layer: 1, turns: 1 });
    history.record({ axis: 'x', layer: 2, turns: 1 });

    expect(history.moves).toHaveLength(2);
    expect(history.popInverse()).toMatchObject({ layer: 2 });
    expect(history.popInverse()).toMatchObject({ layer: 1 });
    expect(history.popInverse()).toBeNull();
  });

  it('clears recorded moves', () => {
    const history = new History();

    history.record({ axis: 'x', layer: 2, turns: -1 });
    history.clear();

    expect(history.popInverse()).toBeNull();
  });
});
