Baseline performance snapshot (before next optimization pass)

- Date: $(date)
- Load metrics (observed):
  - LCP: ~190–215 ms (text), CLS: 0.00
- Forced reflow totals (DevTools Insight examples):
  - ~171 ms (earlier), improved to ~134 ms after transform3d labels
  - Major stacks: GridSizer.compute, CayleyGraph3D.setSize, CayleyGraph3D.draw
- Third-party network:
  - Iconify runtime JSON (~480 ms) in critical chain (dev)
  - Large avatars (e.g., loli.net ~3 MB)
- Memory (Chrome performance.memory):
  - Used JS heap ~10.8 MB → ~9.3 MB after drag (no leak signature)

Planned next steps: 30fps gating + visibility pause, DPR clamp, GridSizer rAF throttle, local icons, avatar srcset.

