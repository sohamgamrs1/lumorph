# Lumorph — v22: the null, and why dark mode looked wrong

Three files: `app.js`, `styles.css`, rebuilt `Lumorph.html`.

## The stray "null"

On the results screen, after "Not a measurement." there was a literal **null**.

The side-profile card is `scan.side ? h(...) : null`, and it sits directly inside
`wrap.append(...)`. `h()` filters null children — `Element.append(null)` does not, it
stringifies the argument and prints the word. So a scan with no side photo printed "null"
where the card would have been.

Fixed with a shared empty node, and every screen was then walked and searched for the
word: home, progress, profile, settings, routine, how, results, scan. None left.

## Why dark mode looked darker and wrong

The theme swap in v20 changed the tokens, but **35 glow effects and the aurora background
still carried the old cream-gold numbers** — `rgba(234, 213, 162, …)`, the old purple, and
two hardcoded near-black backgrounds. On a plum page those read as dirty beige halos over
a flat dark slab, which is exactly what you saw.

They are not patched one by one. The accent is now exposed as numbers too —
`--gold-rgb`, `--accent2-rgb`, `--bg-rgb` — and every glow is written
`rgba(var(--gold-rgb), 0.22)`. Both themes drive the same rules, so this cannot drift
again.

## Contrast

Measured, not eyeballed. `--faint` (the small uppercase labels) was:

- **3.94** on the dark background — below the 4.5 minimum for small text
- **2.82** on the light background — clearly failing

Now 4.54 and 4.56. Card surfaces were also almost the same value as the page in dark
mode, so everything read as one slab; surface, surface-2, lines and `--bg-2` are lifted
and separated.
