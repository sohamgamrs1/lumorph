# Lumorph — v26: the seven you found

Six files: `app.js`, `styles.css`, `index.html`, the three static pages, rebuilt
`Lumorph.html`.

## 1. The "null" on the routine screen

`block()` returns `null` for an empty group, and `null` was going straight into
`append()`, which stringifies it. Same bug as the side-profile card in v22 — I fixed the
instance then and not the class. Every conditional child is now `NOTHING`, a real empty
node.

## 2. The face model that would not load

This was the serious one. `ensureLandmarker()` caches its promise in `cam.lmReady`. When
the load **failed**, the rejected promise stayed cached — so every later attempt failed
instantly, including upload, which waits on the same function. One bad network moment
broke scanning for the rest of the session.

- The cached promise is cleared on failure, so a retry can actually retry.
- A second CDN (unpkg) is tried if jsDelivr fails.
- The wait went from 25 to 45 seconds, and the countdown hands over to "…" rather than
  claiming a number it cannot keep.
- A **Retry** button appears on the camera when it gives up.

## 3. Icons off-centre

The SVGs are 24×24 inside 12–20px containers, so they overflowed their circles. Icon
containers now use `display: grid; place-items: center` and every icon SVG is forced to
`width/height: 100%`.

## 4. Routine

- Steps are now **tappable** — the tick and the XP work exactly like the home quests.
- **Daily quests are their own list again**: five fixed habits (morning, evening, sleep,
  water, posture). The routine screen holds the detailed steps. They share ids where they
  are the same action, so ticking one shows on the other.

## 5. A gift button

Beside the profile icon on home. Opens the redeem sheet directly.

## 6. Dark mode wrecking the colours

The app never declared `color-scheme`, so **Chrome's Auto Dark Theme** was recolouring the
palette itself — which is why dark mode looked grey-green and washed instead of plum and
copper, and why the light theme looked flat. Now declared in the markup
(`<meta name="color-scheme" content="dark light">`) and in CSS per theme, which tells the
browser the app handles this itself and to leave it alone.

## 7. The AI read that never answers

- It can be **cancelled** — there is a Cancel button on the reading card.
- It **times out after 45 seconds** with a real message instead of spinning forever.
- A second read **aborts the first**, and a stale response from an old read is ignored
  rather than overwriting the new scan.
- A cancelled read shows "Cancelled" and a Try again button.
