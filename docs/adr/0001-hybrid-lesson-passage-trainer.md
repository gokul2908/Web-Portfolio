# Typing Trainer is a hybrid Lesson + Passage product

The **Typing Trainer** Playground combines two distinct typing-tool products inside a single route: **Lesson** mode (Keybr-style adaptive generation from a growing **Keyset**) and **Passage** mode (Monkeytype-style verbatim typing of curated text or a pasted **CustomPassage**). The visitor picks via a mode toggle; defaults are **Tracking** on and **Lesson** mode, so the critical path is "press Enter, type".

## Why two modes instead of one

The brief was "heavily inspired by Keybr" but a portfolio Playground also benefits from immediately-engaging curated content — pseudo-words from a `e t a o i n` Keyset are not interesting to a 30-second visitor in the same way a Hemingway quote is. **Lesson** earns the depth claim; **Passage** earns the first-impression claim. We considered each alone and chose both.

## Why one Playground, not two routes

Shared surface area is enormous: overlay/focus logic, input capture, virtual keyboard, WPM/Accuracy computation, **Profile** state. Two routes would duplicate all of that for the sake of a URL distinction that doesn't help the visitor.

## Consequences

- Two keystroke handlers (see ADR-0002) and two **Run** source kinds (**Lesson**, **Passage**) that the **Profile** must distinguish.
- **Tracking** preference gates **Lesson** mode availability — when off, only **Passage** mode is selectable. This is the load-bearing rule that makes "two products in one Playground" coherent rather than confusing.
- Future architecture reviews should not propose unifying the two pipelines; the split is the point.
