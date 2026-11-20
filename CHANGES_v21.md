# Lumorph — v21: calibration loop and a camera that says what it is doing

Three files: `app.js`, `styles.css`, rebuilt `Lumorph.html`.

## 1. Every scan now keeps its numbers

Each scan stores its 22 raw measurements — symmetry, thirds, fifths, eye span, midface
ratio, jaw, gonial angle, brow, lips, canthal tilt, eye aperture, nose, philtrum, mouth,
vermilion, evenness, redness, under-eye, shine, texture. About 400 bytes per scan.

Nothing is uploaded; it sits in the same local storage as everything else.

## 2. A one-tap answer after every result

Under the score: **Too low / About right / Too high**, plus a small field for the score
you would have given the photo yourself. One tap, stored locally, and it becomes a
labelled data point.

## 3. Settings → Calibration → Export measurements

A CSV with one row per scan: date, gender, age, score, tier, your feedback, your own
score, then all 22 measurements as columns. That is the file I need to fit the reference
bands to real faces instead of to my reading of the literature.

## 4. The camera warm-up

The face model is a few megabytes on a cold visit and the screen used to show a dead
shutter while it arrived. Now:

- A **7 second countdown** with a progress bar, on the first scan of a session only.
- The shutter stays locked until the countdown finishes **and** the model is actually
  ready — the timer never opens the gate early.
- Once loaded, `lmCached` is remembered, so every later scan skips the wait entirely.
- If the download stalls, it gives up after 25 seconds with a real error rather than
  spinning forever.

## Two bugs found while testing

- A stray `null` was being printed under the shutter when no bonus scans were left
  (`Element.append(null)` renders the word "null").
- The calibration export crashed the whole Settings page on a scan with no timestamp:
  `new Date(undefined).toISOString()` throws. Guarded.
