# Lumorph — v13: share card line spacing

Two files: `app.js`, rebuilt `Lumorph.html`.

## What overlapped

On the share card the three lines beside the score were stacked 40px apart at font sizes
of 26px, 62px and 34px. "Solid" at 62px has an ascender around 45px above its baseline,
so it climbed straight into "out of 10" sitting 40px above it.

Now they sit at 468, 560 and 618 — gaps of 92 and 58 against those type sizes — and the
text column starts 30px clear of the number instead of 26.

Checked by rendering the card at 1080×1350: "out of 10", "Solid" and "High Tier Normie"
are cleanly separated.

The PDF report uses the same pattern but at 44/34/16px with 50/46/26px gaps, so it never
collided. Rendered and confirmed.
