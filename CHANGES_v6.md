# Lumorph — v6: landmark mesh and the tier ladder

Four files: `engine.js`, `app.js`, `styles.css`, and the rebuilt `Lumorph.html`.

## 1. The landmark mesh, visible

- **Live, over the camera.** A canvas sits on top of the preview and draws the mesh every frame the face is detected, in gold. A **Mesh** pill in the corner turns it off if it distracts you.
- **On the result.** A new button in the results header opens a **478 points** sheet: your photo with the mesh drawn over it, plus a **Numbers** toggle that labels the face-oval points.
- On a device, the mesh uses **MediaPipe's own tessellation** when the package exposes it. Where it does not, it falls back to a built-in contour topology: face oval, both eyes, both brows, nose bridge, nose base and both lips. Both draw through the same renderer.
- Preview mode has no face to read, so it lays that same topology out on a parametric face — oval, eyes, brows, nose and lips — rather than showing nothing.

## 2. The tier ladder

The overall score now maps onto the ladder you specified, and the name depends on gender:

| Score | Male / other | Female |
| --- | --- | --- |
| below 2 | Sub 3 (S3) | Sub 3 (S3) |
| 2 – 3 | Sub 5 (S5) | Sub 5 (S5) |
| 3 – 4 | Low Tier Normie (LTN) | Low Tier Beauty (LTB) |
| 4 – 5 | Mid Tier Normie (MTN) | Mid Tier Beauty (MTB) |
| 5 – 7 | High Tier Normie (HTN) | High Tier Beauty (HTB) |
| 7 – 8 | Chad Lite (CL) | Stacy Lite (SL) |
| 8 – 9 | Chad (C) | Stacy (S) |
| 9 – 10 | True Adam (TA) | True Stacy (TS) |

It appears in four places: under the score on the result screen with its band (for example `CL · 7 – 8`), as a small chip on the home focus card, in serif under the score on the share card, and beside the score on the PDF report.

## What has not changed

The score itself. The tier is a label for the same weighted geometric composite — it does not add or remove measurements. The "describes the photo, not you" framing stays on the result screen and in the report.
