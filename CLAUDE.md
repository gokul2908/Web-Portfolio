# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then build with Vite
- `npm run lint` — ESLint over the repo
- `npm run preview` — serve the production build locally

There is no test runner configured. `src/App.test.js` and `src/setupTests.js` are Create React App leftovers with no `test` script behind them.

Node >= 20.11.0 (`.nvmrc` pins v23.4.0). Formatting follows `.prettierrc.cjs`: tabs, single quotes, 120-char lines, trailing commas.

## Required reading

- **`CONTEXT.md` is the domain glossary.** Use its terms exactly (Showcase, Playground, Lesson, Passage, Run, Keyset, Heatmap, Profile, Tracking, ActiveTime, DailyGoal) and avoid the listed alternatives. Its "Flagged ambiguities" section records decisions already made — don't re-litigate them (e.g. no composite Score metric, QWERTY only, mobile out of scope for the Typing Trainer).
- **`docs/adr/`** holds architecture decision records for the Typing Trainer. Two are load-bearing and explicitly warn against "obvious" refactors:
  - ADR-0001: Lesson and Passage modes are two products in one route by design — do not propose unifying their pipelines.
  - ADR-0002: Lesson mode is stop-on-error with Backspace disabled; Passage mode is allow-through with Backspace enabled. The two keystroke handlers are a deliberate split, not duplication to clean up.

## Architecture

React 18 + TypeScript + Vite (SWC) SPA. Styling is a mix of MUI (with Emotion), Tailwind 4 (via the Vite plugin), and per-component plain CSS files.

Routing ([src/App.tsx](src/App.tsx), react-router `createBrowserRouter`):

- `/` — user picker ([src/pages/users](src/pages/users/index.tsx))
- `/tictactoe` — 3D Tic-Tac-Toe Playground (Three.js)
- `/typing` — Typing Trainer Playground
- `/:name` — portfolio Homepage for that user

The portfolio content is data-driven: `src/user_details.ts` is an array of user records (intro text, navigation, showcases, resume link, etc.). `Homepage` looks up the record by the `:name` route param and spreads it into the components in `src/components/` (intro, projects, navigation, resumeModal, videobgeffectmodal). To change portfolio content, edit `user_details.ts`, not the components.

`src/components/videobgeffectmodal/` is the selfie-cam recorder; it uses `@mediapipe/tasks-vision` for background effects and face crop.

### Typing Trainer

The entire Playground lives in one file: [src/pages/typing/index.tsx](src/pages/typing/index.tsx) (~1800 lines). Key facts:

- All state is client-side only — the Profile (runs, heatmap, keyset, preferences, in-progress CustomPassage) persists to localStorage under `typing-trainer-profile` with a schema version constant. There is no backend.
- The adaptive Keyset starts at `e t a o i n` and grows in English letter-frequency order, gated on per-key Heatmap accuracy AND speed relative to the Profile's own average WPM (constants at the top of the file: `ACCURACY_THRESHOLD`, `SPEED_RATIO_THRESHOLD`, `HEATMAP_WINDOW`).
- The Tracking preference gates Lesson mode availability: Tracking off → Passage mode only, no Heatmap/Keyset maintained.
- WPM = (correct chars / 5) / minutes; Accuracy is per-keystroke. The two modes feed Accuracy from different keystroke streams (see ADR-0002) — that's intentional.
