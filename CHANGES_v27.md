# Lumorph — v27: nav alignment, the badge, the redeem redirect, and Ascend

Seven files: `app.js`, `styles.css`, rebuilt `Lumorph.html`, plus `build.js`, `boot.js`,
`i18n.js`, `engine.js`.

## 1 and 2 — both were my own rule

In v26 I added an icon-centring rule that turned `.pill` and `.tabbar button` into grids.
That stacked the rank badge's dot above its label, and made the nav icons fill the whole
button instead of sitting at 20px. The rule now applies only to containers that hold a
single icon; pills stay inline-flex and tab buttons stay flex-column.

## 3 — redeeming from home threw you into settings

The success path ended with `go('settings')`, regardless of where the sheet was opened
from. It now stays put: you redeem from home, you stay on home.

## 4 — Ascend

A fourth tab, and a ninety-day challenge behind it.

- **Start day one** opens it. The counter runs on calendar days from that moment.
- **Today's quests are the same list as home** — the five habits. Clear all five and the
  day is banked. Because the record is the quest log itself, a missed day simply stays
  empty; there is nothing to rewrite and nothing to backfill.
- **Ninety dots**, one per day: filled for a completed day, ringed for today, faded for a
  missed one.
- **+1000 XP and 5 extra scans** on the ninetieth completed day, paid once.

## Also fixed while in there

The quest counters said "of 6" — a leftover from when there were six fixed quests. They
read the length of the daily list now, so "2 of 5" and "2/5" agree with what is on screen.

## A note on this build

The v26 zip shipped the built `Lumorph.html` but not `boot.js`, `i18n.js`, `engine.js` or
`build.js`. I recovered the three modules from inside the build (they were unmodified) and
rewrote `build.js`. It now strips the CSP meta from the single-file build, which is what
lets the inlined scripts run from `file://` — the deployed version keeps its CSP through
`vercel.json`.
