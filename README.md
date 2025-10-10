# Team Homepage

This project implements an animated team homepage with a concise modern stack. See Tech Stack below for an accurate, code‑derived list of tools used in this repository.

## Tech Stack

- Build: Vite 7 (rolldown-vite), @vitejs/plugin-react
- Bundling: Rolldown advancedChunks, Rollup-compatible manualChunks
- Language: TypeScript 5
- Framework: React 19, ReactDOM 19
- Math typesetting: KaTeX 0.16 (logo and panel formulas)
- Animation: AnimeJS (background, cards, interactions)
- Icons: @iconify/react
- Graphics: Canvas 2D (CayleyGraph, CayleyGraph3D)
- Styles: Plain CSS (`src/index.css`)
- Runtime/PM: Bun (`bun.lock` present)

## Object Structure

Each team member follows this shape:

```
id: string
avatar: string (URL)
introduction: string
links: string[]
```

See `src/types.ts#L1` and `src/data/team.json#L1`.

## Getting Started

- Install: `bun install`
- Dev: `bun run dev`
- Build: `bun run build`
- Preview (after build): `bun run preview`

## Configuration

- Team name: set `VITE_TEAM_NAME` in `.env` (see `.env.example`).

## Notes

- Vite aliases to rolldown-vite for production builds; Rollup options are kept for compatibility.
- Chunking groups heavy deps (`react`, `react-dom`, `animejs`, `katex`) into a vendor chunk.
- Reduced-motion respected throughout; background grid and spotlight animations degrade gracefully.
- Images use lazy loading and explicit dimensions to reduce layout shift.

## Add Members

Append a new object to `src/data/team.json` with the required fields. Invalid URLs or failed images fall back to a transparent pixel while retaining layout.
