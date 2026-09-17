// Hand-authored 3x3 "checkerboard" shown by the theme editor. Kept as a
// snapshot rather than a move sequence: no short face-turn sequence reproduces
// this exact arrangement (verified by search), and parity is the acceptance bar.
const States = {
  3: {
    checkerboard: {
      size: 3,
      pieces: [
        { name: 0, cell: [2, 0, 2], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
        { name: 1, cell: [0, 2, 1], orientation: [1, 0, 0, 0, -1, 0, 0, 0, -1] },
        { name: 2, cell: [2, 0, 0], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
        { name: 3, cell: [0, 1, 0], orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
        { name: 4, cell: [2, 1, 1], orientation: [-1, 0, 0, 0, -1, 0, 0, 0, 1] },
        { name: 5, cell: [0, 1, 2], orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
        { name: 6, cell: [2, 2, 2], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
        { name: 7, cell: [0, 0, 1], orientation: [1, 0, 0, 0, -1, 0, 0, 0, -1] },
        { name: 8, cell: [2, 2, 0], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
        { name: 9, cell: [1, 2, 0], orientation: [-1, 0, 0, 0, -1, 0, 0, 0, 1] },
        { name: 10, cell: [1, 0, 1], orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
        { name: 11, cell: [1, 2, 2], orientation: [-1, 0, 0, 0, -1, 0, 0, 0, 1] },
        { name: 12, cell: [1, 1, 2], orientation: [1, 0, 0, 0, -1, 0, 0, 0, -1] },
        { name: 13, cell: [1, 1, 1], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
        { name: 14, cell: [1, 1, 0], orientation: [1, 0, 0, 0, -1, 0, 0, 0, -1] },
        { name: 15, cell: [1, 0, 0], orientation: [-1, 0, 0, 0, -1, 0, 0, 0, 1] },
        { name: 16, cell: [1, 2, 1], orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
        { name: 17, cell: [1, 0, 2], orientation: [-1, 0, 0, 0, -1, 0, 0, 0, 1] },
        { name: 18, cell: [0, 0, 2], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
        { name: 19, cell: [2, 2, 1], orientation: [1, 0, 0, 0, -1, 0, 0, 0, -1] },
        { name: 20, cell: [0, 0, 0], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
        { name: 21, cell: [2, 1, 0], orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
        { name: 22, cell: [0, 1, 1], orientation: [-1, 0, 0, 0, -1, 0, 0, 0, 1] },
        { name: 23, cell: [2, 1, 2], orientation: [1, 0, 0, 0, 1, 0, 0, 0, 1] },
        { name: 24, cell: [0, 2, 2], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
        { name: 25, cell: [2, 0, 1], orientation: [1, 0, 0, 0, -1, 0, 0, 0, -1] },
        { name: 26, cell: [0, 2, 0], orientation: [-1, 0, 0, 0, 1, 0, 0, 0, -1] },
      ],
    },
  },
};

export { States };
