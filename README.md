# Team Homepage (Vite + React + AnimeJS, Bun)

This project implements a small, animated team homepage using Vite (Rolldown-powered in production), React 18, AnimeJS, and Bun as the package/runtime manager.

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

## Notable Design Decisions (after reading docs)

- Vite 7 + React plugin: `@vitejs/plugin-react` for JSX/HMR.
- Rolldown bundler: Aliases `vite` to `rolldown-vite@latest` for faster builds.
- Chunking: Rolldown `advancedChunks` (with Rollup fallback `manualChunks`) groups `react`, `react-dom`, `animejs`, `katex` into a `vendor` chunk.
- Bun support: Runs `vite` via `bun run` scripts; Bun is fully compatible.
- AnimeJS: Uses a `timeline` for sequencing and `stagger` for grid entrance.
- Reduced motion: Respects `prefers-reduced-motion` and short-circuits animations.
- Performance: `loading="lazy"`, `decoding="async"`, fixed `width/height` for image stability.
 - Backdrop spotlight: Follows cursor; on window blur/visibility hidden it “scatters” (expands and softens), and restores on focus. Honors reduced-motion.
 - Dev warmup: Vite `server.warmup` pre-transforms common modules to avoid initial waterfalls.

## Add Members

Append a new object to `src/data/team.json` with the required fields. Invalid URLs or failed images fall back to a transparent pixel while retaining layout.
