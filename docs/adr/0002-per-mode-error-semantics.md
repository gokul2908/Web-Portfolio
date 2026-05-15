# Per-mode error semantics: Lesson = stop-on-error, Passage = allow-through

The **Typing Trainer** uses two distinct keystroke pipelines depending on the **Run**'s source kind. **Lesson** mode is stop-on-error (Keybr discipline): a wrong key refuses to advance the cursor and Backspace is disabled — there is nothing to undo from a blocked state. **Passage** mode is allow-through (Monkeytype pragmatism): a wrong key renders red but the cursor advances, and Backspace is enabled so the visitor can correct typos in flight.

## Why not one unified handler

Stop-on-error in a 200-character literary **Passage** is rage-inducing — getting locked on character 47 over "teh" vs "the" ruins the prose-typing experience that **Passage** mode exists to provide. Allow-through in a **Lesson** defeats the entire adaptive **Keyset** mechanic, which depends on enforced correct repetitions to drive the **Heatmap**. The two modes have different jobs and a unified handler would do both badly.

## Consequences

- **Accuracy** is computed from different keystroke streams in the two modes — stop-on-error counts the wrong-then-recovered keystrokes; allow-through counts the wrong-and-left keystrokes. The keystroke-level formula (`correct / total`) is the same; the input stream is not. This is acceptable: both are honest measurements of distinct activities, not the same metric computed two ways.
- A future reader scanning the code will find two keystroke handlers and may reflexively suggest unification. They should not. This is the deliberate split that makes ADR-0001 work.
- Backspace handling is mode-conditional, not a global UX rule.
