# Lumorph — v12: four fixes

Three files: `engine.js`, `app.js`, rebuilt `Lumorph.html`.

## 1. Every value was zero

A hard crash, and my fault from the last update. When I rewrote the facial-thirds
calculation I deleted the `thirds` array but left `thirds` in the object `rawMetrics`
returns. So every scan threw `ReferenceError: thirds is not defined`, the try/catch in
the scan handler swallowed it, and the score was computed from an empty object — 0.0 for
everything, every time.

There was a second one behind it: the new midface calculation passed a point with only a
`y` value to `vertical()`, which reads `x` too, so that metric came out `NaN`.

Both fixed. Verified: 22 measurements, zero of them zero, overall 6.7 on a test scan.

## 2. The close button sent you back through onboarding

It read `go(lastScan() ? 'home' : 'onboarding')` — so with no scans yet, closing the
camera dropped you into the details flow. It now goes home whenever onboarding is done.

## 3. The first tap on Scan appeared to do nothing

The face model is a ~3MB download on a cold visit, and the screen gave no sign of it: the
video started, but the chips stayed red and the shutter stayed disabled until it finished,
which looks exactly like a dead button. Second and third attempts worked because the
model was then cached.

Now: the hint reads "Loading the face model…", the step pill dims, and the model is
fetched in the background 2.5 seconds after you reach home, so by the time you tap Scan it
is usually already there.

## 4. Labels

The last onboarding step said "Take my first scan" but only opened the app, so it now says
**"Step into Lumorph"**. The home empty state really does start a scan, so it keeps
"Take your first scan".
