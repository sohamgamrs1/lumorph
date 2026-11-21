# Lumorph — v29: the share card in the light theme

Two files: `app.js`, rebuilt `Lumorph.html`.

## What changed

The card is drawn on a canvas, so it cannot inherit CSS variables — every colour was a
literal. There is now a `cardPalette()` that reads the active theme and returns the right
set, and the three painters (background, orb, card) take it as an argument.

**Light:** paper `#F4F2ED`, ink `#14181C`, pine accent `#2F6B57`, bars running
`#7FB39F → #2F6B57 → #1F4F40`, and a much softer background wash so it reads as paper
rather than sage.

**Dark:** unchanged — plum, copper, the same gradients as before.

The card follows whatever theme the app is in when you tap share. No setting to find, and
nothing to keep in sync.

## Verified

Both rendered at 1080×1350 and compared side by side: the light card keeps its contrast on
every element — score gradient, pillar bars, labels, streak pill and footer.

## Not done

The **PDF report** still draws in the dark palette. It is a separate painter with its own
colours; say the word and I will give it the same treatment.
