# Lumorph — v5: share, side profile, languages, report

Seven files. One is new: `i18n.js`. Add it to the repo root.

## 1. Share card

A Share button on every result renders a 1080×1350 card — the score, the five pillars, the streak, the wordmark — and opens the native share sheet. Falls back to a download where the share sheet is unavailable. No technical text anywhere on it: no landmark counts, no beta labels, no "on-device".

## 2. Side profile, and the scan screen rebuilt

- The scan is now two steps: **front**, then **side**, with a different guide for each. The oval was redrawn with eye-line ticks and a brow arc, and it sits dead centre of a full-bleed panel.
- The side guide is a profile outline rather than an oval, so it is obvious what to line up.
- A shutter button replaces the old text button, with a flash on capture, and the step pill shows 1 of 2 / 2 of 2.
- You can skip the side photo, and the tab bar is hidden while scanning so nothing competes with the camera.
- The side reading is **beta and never counted in the overall score**. It reports a jaw-line angle and a chin-projection angle.

## 3. Lighting normalisation

Before the skin signals are read, exposure is pulled toward a neutral target and contrast is gently flattened. A dim room no longer scores as worse skin than a bright one. The gain is capped, so it corrects a badly lit photo rather than inventing detail in it.

## 4. Tap a measurement to see it

Every row in the Ratings tab is now tappable. It opens the photo with the actual landmark points and the measurement line drawn on it, plus the value, the score and what to do about it.

To make that work, each scan now stores its landmark points as compact integers — about 4KB per scan — so the overlay can be redrawn at any time without keeping a second copy of the photo. Thumbnails also went from 220px to 320px.

## 6. Weekly recap

A "Your week" card on Progress opens a seven-day summary: scans taken, average score, change against the previous week, days cleared, current streak, and the pillar that gained most.

## 7. Hindi and Bengali

A Language section in Settings with English, हिन्दी and বাংলা. Around 250 interface strings are translated — navigation, home, onboarding, results, settings, scan flow and every pillar name. Anything not yet translated falls back to English rather than showing a broken key.

**Coverage limit, stated plainly:** the legal documents, the long "how these numbers are calculated" page, and the per-measurement advice lines are still English. They are long-form prose and deserve a proper translation pass rather than a machine pass.

## 10. PDF report

A report button on every result builds a one-page A4 PDF — dark header with the wordmark and your name, the score, the pillar bars, the last eight scans, and the disclaimer. It is rendered to an image and wrapped in a hand-built PDF, so there is no library and no network call.

## Not done, as you asked

Play Store wrapper, affiliate links, streak freeze.
