# Lumorph — v11: the measurements were wrong

Four files: `engine.js`, `app.js`, `api/rate.js`, rebuilt `Lumorph.html`.

## 1. Onboarding no longer forces a scan

After the last step it went straight to the camera. It now lands on **home** with a
greeting and a "Take your first scan" button, so the scan is the user's choice.

## 2. The rating bug: four measurements were pinned at zero

The screenshots showed the answer. These values are not a calibration problem, they are
impossible readings:

| Shown | Was measuring | Should have been |
| --- | --- | --- |
| Eye spacing 0.654 | outer-corner span / face width | band was for **pupil** distance (0.43–0.49) |
| Midface ratio 2.26 | nasion → subnasale (lower midface only) | eye line → upper lip |
| Chin width 0.94 | points 132/361, which are the **jaw** | the chin, band 0.16–0.27 |
| Brow prominence 0.16 | divided by the wide eye span | band was set for pupil spacing |
| Facial thirds 12.3% dev | top of the mesh used as the **hairline** | nasion → subnasale vs subnasale → chin |
| Tone evenness 26%, shine 100%, under-eye −10% | exposure gain blowing the image out; shine was absolute brightness; negative shadow | capped gain, highlight lift instead of brightness, no negative shadow |

Four of them scored **0.0**, which is what dragged a model's face to 3.7.

Fixed:

- **Eye span** — same measurement, correct band (0.58–0.70), renamed so it says what it is.
- **Midface ratio** — now eye line to upper lip, band 1.22–1.62.
- **Jaw width** — relabelled and re-banded (0.84–0.96) instead of pretending to be chin width.
- **Brow prominence** — band corrected to 0.13–0.22.
- **Facial thirds** — only the two measurable thirds are compared, so the hairline no longer matters.
- **Exposure** — gain capped at 1.35, contrast pulled 15% toward the mean.
- **T-zone shine** — how far the highlights sit above the T-zone median, not absolute brightness, so a lamp change no longer reads as oily skin.
- **Under-eye** — no shadow now scores well instead of middling.

Fed the exact values from the screenshot into the corrected rubric: **8.2, Chad**, pillars
9.7 / 6.5 / 5.1 / 8.6 / 9.3. An ordinary face on the same rubric reads 6.5, High Tier
Normie.

**Old scans keep their old scores.** They are stored, not recomputed. Rescan to see the
new numbers.

## 3. "High demand" from the model

A 503 from Google is usually a spike, so the function now waits 700ms and retries once,
then moves to the next model before giving up. Tested: a busy model returns 200 on the
retry. The message now says Google is busy rather than repeating their raw text.
