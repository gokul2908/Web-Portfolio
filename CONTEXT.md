# Web Portfolio

Personal portfolio site that presents Gokul's work and hosts a small set of interactive playgrounds (a 3D Tic-Tac-Toe, and a planned Keybr-style **Typing Trainer**). This file is the domain glossary — it defines the language the codebase and conversation should use. It is **not** a spec or implementation log.

## Language

### Site

**Showcase**:
A work sample listed on the portfolio (case study, video, screenshots, links).
_Avoid_: Project, work, portfolio item — `Project` is overloaded with "codebase" and should not be used for this.

**Intro**:
The above-the-fold landing section presenting Gokul, role, and short summary.
_Avoid_: Hero, banner, splash.

**Playground**:
A self-contained interactive demo hosted on its own route (e.g. 3D Tic-Tac-Toe, the upcoming **Typing Trainer**). A Playground is distinct from a **Showcase** — a Showcase _describes_ work, a Playground _is_ the work, running live in the browser.
_Avoid_: Demo, app, experiment, page (too generic).

**Resume**:
The downloadable / viewable CV surfaced through the resume modal.

### Typing Trainer

**Lesson**:
A string *generated* from the current **Keyset** that the user types in one sitting. Adaptive mode only — pseudo-words drawn from the letters the **Keyset** currently exposes.
_Avoid_: Test, exercise, round. Do not use **Lesson** for curated text — that's a **Passage**.

**Passage**:
A fixed-text excerpt the user types verbatim. Not generated, not tied to the **Keyset**. Comes from one of two sources: the shipped **PassageLibrary**, or a **CustomPassage** the visitor pastes in.
_Avoid_: Text, quote, prompt, sample.

**PassageLibrary**:
The set of **Passages** shipped with the application — ~30 hand-picked entries spanning **Categories** like literary, tech, code, and pangram. Curated by the site owner, fixed at build time, never edited by visitors.
_Avoid_: Catalog, collection, content.

**Category**:
A tag attached to each **PassageLibrary** entry (literary / tech / code / pangram). Drives filter affordances in **Passage** mode.
_Avoid_: Tag, type, kind.

**CustomPassage**:
A **Passage** the visitor pastes in at the typing surface. Persisted in the **Profile** *while in progress* — survives crashes and page reloads mid-typing — and cleared once the visitor completes it (still single-use within a session, but recoverable across refreshes). Length is bounded only at the upper end by a localStorage-safety cap (~50,000 chars); the visitor can paste anything from a short tweet to a long chapter.
_Avoid_: User passage, pasted text, custom text.

**Keyset**:
The subset of characters a **Lesson** may draw from. A new **Profile** starts with `e t a o i n` (the six most-frequent English letters). New letters join in English letter-frequency order, gated on the per-letter **Heatmap** showing *both* sufficient accuracy *and* sufficient speed measured relative to the **Profile**'s own current average **WPM** — slow-and-careful typing alone is not enough to unlock the next letter, and neither is sloppy-fast typing.
_Avoid_: Alphabet, charset, layout.

**Run**:
One attempt at one **Lesson** *or* one **Passage**, ending when the user finishes typing or abandons it. Produces metrics: **WPM**, **Accuracy**, per-key timings. A **Run** carries its source kind (Lesson vs Passage) — downstream rules differ.
_Avoid_: Attempt, session, try.

**WPM**:
Words per minute, computed as (characters typed correctly / 5) / minutes. The canonical speed metric. **KPM** (keys per minute) is not used — pick one.

**Accuracy**:
Correct keystrokes / total keystrokes, over a single **Run**. Errors are counted at the keystroke, not the word.

**Heatmap**:
The per-key view of accuracy and speed aggregated across recent **Runs**. Drives **Keyset** growth — a key joins the **Keyset** only when its **Heatmap** stats clear a threshold.

**Profile**:
The per-visitor record of **Runs**, **ActiveTime** by day, and visitor preferences (**Tracking**, **DailyGoal** target). When **Tracking** is on, the **Profile** also owns the **Heatmap** state and the current **Keyset**. Stored client-side only — there is no account system.
_Avoid_: User, account.

**ActiveTime**:
Wall-clock seconds during which the **Profile** is in an active **Run** (overlay hidden), summed per local-day. Drives the **DailyGoal** progress bar. Not filtered for in-Run idleness — staring at the screen mid-**Run** still counts; only **Deactivation** (click-away) stops the timer.
_Avoid_: Practice time, study time, focus time.

**DailyGoal**:
A per-**Profile** preference: a target number of **ActiveTime** seconds per local-day (default 600s / 10 minutes). Surfaced as a progress bar in the metrics area. Rolls over at local midnight, not UTC. Configurable from settings, off the critical path.
_Avoid_: Streak, goal, target.

**Tracking**:
A per-**Profile** preference that controls whether **Runs** feed the **Heatmap**. Defaults to on for a new **Profile**. When on, both **Lesson** and **Passage** **Runs** contribute, and **Lesson** mode draws from an adaptive **Keyset** that grows from the **Heatmap**. When off, no **Heatmap** or **Keyset** is maintained and **Lesson** mode is unavailable — only **Passage** mode is selectable. The toggle lives off the critical path (settings, not the landing surface).
_Avoid_: Stats, analytics, progress.

## Relationships

- A **Showcase** lives on the homepage; a **Playground** lives on its own route.
- A **Profile** owns one current **Keyset**, one chosen mode (Lesson or Passage), per-day **ActiveTime**, a **DailyGoal** target, and accumulates many **Runs**.
- A **Run** is an attempt at either a **Lesson** (generated from the current **Keyset**) or a **Passage** (curated text).
- The **Heatmap** is derived from **Runs**; the **Keyset** is derived from the **Heatmap**. *Whether **Passage** Runs feed the **Heatmap** is open — see flagged ambiguities.*

## Example dialogue

> **Dev:** "When the user finishes a **Lesson**, do we update the **Keyset** immediately?"
> **Domain expert:** "No — we update the **Heatmap** at the end of every **Run**, but the **Keyset** only grows when the **Heatmap** crosses a threshold. That's what makes it adaptive instead of linear."

> **Dev:** "Should the **Typing Trainer** be a **Showcase**?"
> **Domain expert:** "No. A **Showcase** describes past work. The **Typing Trainer** is a **Playground** — you can also _link_ to it from a **Showcase** entry, but the route itself is a **Playground**."

## Flagged ambiguities

- "Project" was used for both a **Showcase** (work sample on the site) and the codebase itself. Resolved: **Showcase** is the domain term; "project" in the codebase-sense is general programming vocabulary and stays out of this glossary.
- "Page" was being used for both ordinary content routes and **Playgrounds**. Resolved: **Playground** is the domain term for interactive demo routes. Ordinary content routes are just "routes" — no special term needed.
- **WPM** vs **KPM** as the speed metric — picked **WPM** for consistency with Keybr / typing-trainer convention. Revisit if a non-Latin **Keyset** is ever introduced.
- **Lesson** vs **Passage** — resolved: **Lesson** is generated (adaptive), **Passage** is curated (verbatim). They are sibling source kinds for a **Run**, picked by the user via a mode toggle inside the single **Typing Trainer** Playground.
- **Heatmap** feed from **Passage** Runs — resolved via the **Tracking** preference. When **Tracking** is on, *both* **Lesson** and **Passage** **Runs** feed the **Heatmap** (option a). When off, no **Heatmap** is collected.
- A composite **Score** metric was considered and rejected. The only two metrics shown to the visitor are **WPM** and **Accuracy**. Don't re-introduce a composite score without first establishing that the product has return-visiting users who would benefit from a single comparable number.
- Keyboard layout is **QWERTY only**. Dvorak / Colemak / international layouts are out of scope. The **Keyset** introduction order is QWERTY-frequency-aware; adding a non-QWERTY layout means rethinking that order as well as the visual keyboard.
- Mobile / touch is **explicitly out of scope** for the **Typing Trainer**. No responsive breakpoints, no touch-keyboard handling, no autocorrect defences. Visitors on mobile may see a degraded or broken experience — that's accepted. Revisit only if visitor analytics show a non-trivial mobile share, *and* there is a coherent product story for typing on glass.
