# Lumorph — v20: Plum + Copper, with Paper + Pine in light

Seven files. The look is new; nothing about how the app works changed.

## The theme

**Dark (default): Plum + Copper.** A violet-black ground (#100812) with copper
(#F0A170 → #C97B4E) and **Fraunces** as the display face — high stroke contrast, a real
italic. That combination is far enough from LooksIQ's cream-serif-on-black-with-gold that
the two no longer read as the same product.

**Light: Paper + Pine.** Warm paper (#F4F2ED), pine green (#2F6B57), **Manrope** for
display. It is the existing light toggle, re-pointed — Settings → Appearance still
switches it, and it follows the system setting if that is what you chose.

## What changed underneath

- Every colour now comes from a token. Three rules still had literal hexes and a fourth
  set lived in `index.html`; all of them are variables now, so the two themes cannot
  drift apart.
- The score ring used a hardcoded gold SVG gradient. It is copper now, pine in light.
- The share card and the PDF report are canvas drawings with their own colours — those
  were gold too, and are now the same copper.
- The 404, FAQ and privacy pages were rebuilt on the same tokens.
- `og-image.png` is regenerated: 1200×630, Fraunces embedded, copper.

## Still gold

The five posters in `Lumorph_posters_all_ratios.zip` predate this palette. Say the word
and I will regenerate all fifteen ratios in copper — the layout and copy are unchanged.
