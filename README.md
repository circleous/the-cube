# The Cube

A Rubik's Cube game for the browser. Built from the original
[Boris Sehovac](https://github.com/bsehovac/the-cube) source.

[![CI](https://github.com/circleous/the-cube/actions/workflows/ci.yml/badge.svg)](https://github.com/circleous/the-cube/actions/workflows/ci.yml)

## Requirements

- [Bun](https://bun.sh) for dependency management and scripts

## Commands

```sh
bun install       # install dependencies
bun run dev       # dev server with HMR
bun run build     # production build into dist/
bun run preview   # serve the production build
bun run lint      # lint with oxlint
bun run lint:fix  # lint and apply safe fixes
bun run format    # format with oxfmt
bun run test      # run the test suite once
bun run check     # lint + verify formatting + test (CI)
```
