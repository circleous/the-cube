# The Cube

A Rubik's Cube game for the browser. Built from the original
[Boris Sehovac](https://github.com/bsehovac/the-cube) source.

## Requirements

- [Bun](https://bun.sh) for dependency management and scripts

## Commands

```sh
bun install       # install dependencies
bun run dev       # dev server with HMR
bun run build     # production build into dist/
bun run preview   # serve the production build
```

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Vite entry point |
| `src/js/` | Game source (ES modules) |
| `src/scss/` | Styles (Sass, compiled by Vite) |
| `public/` | Static passthrough: icons, service worker |
| `dist/` | Build output (gitignored) |

## Notes

- **three.js** is a normal npm dependency (`three@^0.186`), imported as
  `import * as THREE from 'three'`. The original vendored r95 build
  (`assets/js/three.js`) has been removed.
- **Light intensities** in `src/js/World.js` are scaled by π. three r155 made
  lighting physically correct and removed legacy mode, which had scaled light
  intensity by π; the factor is applied explicitly so the cube keeps its
  original look.
- **Offline support** is a hand-written service worker (`public/sw.js`).
  Navigations are network-first; hashed build assets are cache-first. The
  cache is populated on the first online visit, so a first-ever visit while
  offline is not served.
- **Sass** uses `@use` rather than the deprecated `@import`.
