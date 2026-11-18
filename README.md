# Lumorph

**Lookmaxxing, free for everyone.** Face scoring that runs entirely on the device, a routine built from your skin profile, daily quests, streaks, and progress you can actually see.

No account. No server. No subscription. No AI bill.

---

## What it does

- **Scan** — a guided selfie, gated on face, angle, light and focus before it will let you capture.
- **Score** — 22 measurements taken from 478 face landmarks with MediaPipe, on the device, scored against reference ranges by gender. Five pillars: Harmony, Angularity, Dimorphism, Features, Skin signals.
- **Plan** — a short skincare routine generated from your skin type and the three things you said you want to change.
- **Habit** — six daily quests worth XP, ranks, streaks, a five-week heatmap, and a scan history you can chart.

Everything the paid apps put behind a paywall is simply unlocked here, because none of it costs anything to run.

## Why it is free

The expensive part of a face-rating app is the AI. Lumorph does not use one:

| Feature | LooksIQ | Lumorph |
| --- | --- | --- |
| Face measurements | on device | on device |
| Skin read | cloud vision model, per scan | five signals computed from the photo's pixels, free |
| Plan | cloud model | deterministic rules from your profile |
| Cost per user | recurring | zero |

## Two ways to run it

**1. One file, no setup — `Lumorph.html`**

Everything (CSS and JS) is inlined into that single file, so it works when you just open it on a phone. Copy it to your device and open it with Chrome or Safari.

Android note: some file managers open HTML in a preview that refuses to load sibling files, which is why the folder version shows a blank page there. The single file has no siblings to refuse.

The live camera needs a secure context (`https://` or `localhost`), so opening the file directly gives you everything except the live scan — use **Upload** instead, or serve the folder. Add `?demo=1` to the URL to explore with a populated profile and no camera at all.

**2. The folder — for deployment**

```bash
cd lumorph
python3 -m http.server 8080
# open http://localhost:8080
```

Rebuild the single file after any change:

```bash
node build.js
```

Preview with a populated demo profile: `http://localhost:8080/?demo=1` — add `&theme=light` for the light theme.

## The optional AI read

Off by default. When a user turns it on, each scan sends one photo to Google Gemini for a
model estimate of attractiveness, harmony and skin, which is blended 50/50 with the
geometric score.

The key is never in the client. It lives in the deployment environment:

1. Get a free key at `aistudio.google.com/apikey`.
2. Vercel, Project, Settings, Environment Variables: add `GEMINI_KEY` for Production and Preview.
3. Optionally set `GEMINI_MODEL` (defaults to `gemini-2.5-flash`, falling back to `gemini-2.0-flash`).
4. Redeploy.

`api/rate.js` is the serverless function that holds it. It rate-limits per IP, caps the
payload at 3MB, and never returns the key.

## Deploy

**Vercel** — import the repo, framework preset **Other**, no build command, output directory `.` (the repo root). It is a static site; nothing to compile.

**GitHub Pages** — Settings → Pages → Deploy from branch → `main` / root.

**Netlify** — drag the folder onto app.netlify.com, or connect the repo with build command empty and publish directory `.`.

Then install it as an app: open the deployed URL on your phone and choose *Add to Home Screen*. The service worker caches the shell, so it opens offline.

## Files

```
Lumorph.html          single-file build — open this on a phone
build.js              inlines CSS + JS into Lumorph.html
index.html            app shell, fonts, gradients
styles.css            design system and the whole motion layer
engine.js             landmarks → measurements → pillar scores, skin pixel analysis, capture quality
app.js                state, router, views, camera, animations
sw.js                 offline cache
manifest.webmanifest  PWA metadata
icons/                app icons
```

## How the scoring works

`engine.js` is the whole product. Landmarks come from MediaPipe Face Landmarker (478 points). Each metric is a ratio or angle between named points — mirror symmetry, facial thirds, fifths, jaw-to-cheek width, gonial angle, canthal tilt, nose-to-eye-gap, philtrum-to-chin, lip ratios and so on.

Every metric scores 10 inside its ideal band and falls away smoothly outside it (`band()`), so two nearby measurements give two nearby scores and the same photo always gives the same number.

Pillar weights: Harmony 30%, Angularity 20%, Dimorphism 15%, Features 25%, Skin 10%.

**The bands are a first calibration pass.** They are all in one table in `engine.js` (`METRICS` and `genderBands`) precisely so they can be tuned against real photos. If a score feels wrong, tune the band, not the maths.

## Privacy

Photos, measurements, quests and scores live in `localStorage` on the device. There is no backend to send them to. Face recognition and face classification are never used — only landmark positions. Export or delete everything from Settings.

## Limits, stated plainly

- Cosmetic guidance only. Not a medical device, not a diagnosis, not a screening tool.
- Scores move with light, lens, angle and expression. Compare scans taken the same way.
- Skin signals are read from one photo's pixels. They are an appearance estimate, not a measurement of your skin.
- The rubric is a first pass and will need tuning against a real photo set.

## Roadmap

- Side-profile capture and a beta side pillar
- Calibration pass on the bands against ~100 photos
- Optional coach that works with a user-supplied API key (off by default, never required)
- Product suggestions with affiliate links — disclosed, and never affecting ranking

---

Built as a free alternative to LooksIQ. Mechanics inspired by it; code, design and scoring are original.
