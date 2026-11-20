# Lumorph — v19: back navigation

Two files: `app.js`, rebuilt `Lumorph.html`.

## The bug

"How scores work" is reachable from Profile and from Settings, but both of its back
controls were hardcoded to `go('settings')`. Opening it from Profile and pressing back
dropped you into Settings.

The router now records the route you came from, and a detail page returns there. Verified:
Profile → How → back lands on Profile, and Settings → How → back lands on Settings.
