# Lumorph — v3 update

Five files: `index.html`, `styles.css`, `app.js`, `sw.js` and the rebuilt `Lumorph.html`. `engine.js` is untouched.

## 1. Branded splash

A launch screen in the app's own language: the gold orb with its halo, the Lumorph wordmark, "On-device face analysis" underneath, and a thin sweeping line while the app boots. It holds about 800 ms and fades out.

Two safety nets: the splash removes itself with a CSS animation at 2.6 s even if the script never runs, and the script removes it earlier once the first screen is painted. It never traps you on a blank screen.

## 2. Settings & Privacy, rebuilt

Now built from the same parts as the reference screens — section labels, grouped cards, icon tiles, chevrons — rather than a flat list.

- **Appearance** — Dark / Light / System as icon tiles in a segmented card.
- **Selfie photos** — Automatic / Flipped / As saved, with the explanatory line underneath. The setting now actually does something: Flipped mirrors the captured frame and the landmark coordinates together, so a mirrored photo still measures correctly.
- **Notifications** — see below.
- **Scores & legal** — How we calculate your scores, Privacy Policy, Terms of Service, How deletion works, and a Data consent row with the recorded timestamp and a green tick.
- **Promo** — a code field. Lumorph sells nothing, so a code cannot unlock features; a creator code adds 100 XP once and is remembered.
- **Subscription** — one honest row: "No subscription. Ever."
- **Data & account** — Export as JSON, Export as spreadsheets (two CSVs: scans and quests), and Delete all data in red.

Privacy, Terms and Deletion open as bottom sheets with real text, not placeholders.

## 3. Notifications

- Permission is requested only when you ask for it, from a card that explains exactly what you will get.
- Three independent controls: a **daily reminder** at a time you choose (default 20:00), a **streak warning**, and a **weekly re-scan** reminder.
- The reminder is smart about content: it tells you how many quests are left, and stays quiet if all six are cleared.
- It fires at most once a day (tracked by date), schedules itself again after firing, and catches up if you open the app after the scheduled time.
- The service worker now handles `notificationclick` (focuses the app) and `periodicsync`, so on Android Chrome an installed Lumorph can remind you even when it is closed.
- If notifications are blocked, the card says so and tells you where to re-enable them instead of failing silently.

## 4. "How these numbers are calculated"

Rewritten from a short page into a full document, in the same shape as the reference but describing what Lumorph actually does:

- What is measured, and that the 478 landmark points are discarded immediately and never stored.
- The five groups and their weights: Harmony 30, Angularity 20, Dimorphism 15, Features 25, Skin 10.
- How a measurement becomes a score: a reference band, a smooth fall-off outside it, and no randomness.
- Skin signals: five values read from pixels, with the plain statement that no hydration, oil, blood flow or UV is read.
- What affects accuracy, and what is not measured yet — the upper third above the hairline, hair density, and anything needing a side view.
- What is kept, and the full "not medical advice" paragraph.

Nothing was copied from the reference app; the page describes Lumorph's own engine, which has no cloud model and no AI adjustment.

## Still not done

Side-profile capture. The documentation says so plainly rather than implying a beta feature that does not exist.
