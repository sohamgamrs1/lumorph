# Lumorph — v7: side scan, mesh alignment, score range

Four files: `engine.js`, `app.js`, `styles.css`, rebuilt `Lumorph.html`.

## 1. The side step could not detect a face

The quality gate demanded a square-on head — `yaw < 0.075` — on both steps. So the moment you turned to the side, the Angle chip went red and the shutter stayed disabled. Lifting your face brought the yaw back under the threshold, which is why that was the only pose that worked.

The gate is now step-aware. The front step still wants a square-on face; the side step wants a **deliberate three-quarter turn**, roughly 16–62% of a full turn, with a looser roll limit. The guide changed with it: an oval with a turn arrow, and the hint now says "Turn about halfway — not all the way to a profile."

That limit is real, not arbitrary: MediaPipe's landmark model needs to see both sides of a face. At a true 90° profile it stops finding the face at all. A three-quarter view is the furthest it reads reliably.

## 2. The mesh did not line up with the face

The video is drawn with `object-fit: cover`, which **crops** it to the panel. The mesh was mapped straight onto the panel using the video's normalised coordinates, ignoring that crop — so it came out smaller and shifted toward the centre, exactly as your screenshot showed.

Now the overlay computes the cover transform (scale, offset) from the video's real dimensions and maps every point through it. Three related fixes:

- Landmarks are **re-read from the exact frame that gets saved** at capture, instead of reusing the last live detection up to 90ms older. A moving head can no longer leave the mesh trailing the photo.
- The mesh sheet sizes its canvas to the photo's real aspect ratio instead of stretching every photo into a fixed 700×900 box.
- The mesh is drawn from the photo's own pixel geometry, so what you see is what was measured.

## 3. Every rating landed between 5 and 6

That was a design fault, and it is fixed in the maths.

The old rubric gave a full 10 to any value inside a wide "ideal band", and only started losing points outside it. Most faces sit inside most bands, so every face collected a pile of 10s and averaged out to the same number.

Now each measurement **peaks at the ideal centre and falls away on both sides**. Being inside the band is no longer the same as being good. Two further changes:

- Pillar scores blend the arithmetic mean with the geometric mean, so one bad measurement drags the result instead of being averaged away. A face is read by its weakest feature.
- Skin weight went from 10% to 18%, and dimorphism from 15% to 10%.

Measured on synthetic variants of one face, the overall now ranges **3.1 to 7.5** across combinations of narrow jaw, asymmetry, wide nose, low eyes, long midface and skin quality — where before every variant scored about 9.8.

The demo scan now reads 7.0 with pillars of 7.7 / 6.5 / 5.8 / 5.4 / 9.3 rather than a flat set of 9s.

## 4. Stray "null"

Guarded at every place that could print one: profile height, profile name on the home greeting and report, the three side-profile numbers, and the metric detail's value label. A missing value now renders as an em dash instead of the word.

## What this does not fix

Geometry cannot see an ugly face. It measures proportion, and proportion is only part of what makes a face read well. See the note in the chat about adding a model.
