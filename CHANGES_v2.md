# Lumorph — v2 fixes

Five files. `index.html`, `styles.css` and `app.js` replace their old versions in the repo; `Lumorph.html` is the rebuilt single-file version. Nothing else changed.

## 1. Onboarding is validated, and cannot be skipped

Every step now blocks until it is filled in, and says what is wrong in a line above the button, with the button shaking once.

| Step | Rule | Message |
| --- | --- | --- |
| Name | required, 2–12 characters, no digits | "Enter your first name to continue." / "Keep your name to 12 characters or fewer." |
| Gender | required | "Choose one so the right reference ranges are used." |
| Birth date | required, age 13+, not in the future | "You must be 13 or older to use Lumorph." |
| Height | 120–230 cm | "Pick a height between 120 and 230 cm." |
| Skin type | at least one | "Pick at least one skin type." |
| Focus | at least one | "Pick at least one focus." |

The final button re-checks every step before saving, so no combination of back-navigation can produce an empty profile. Errors clear as soon as the field becomes valid.

## 2. Screen compatibility

- The page scrolls. It previously could not: `body` was `height: 100%` with a stretched flex child and `.app` had `overflow: hidden`, so any screen taller than the viewport was clipped. This was the reason onboarding appeared stuck.
- Display type scales with `clamp()` instead of fixed pixel sizes, so headlines do not overflow on narrow phones.
- Added a 320 px breakpoint (tighter padding, smaller cards, smaller ring).
- Horizontal overflow is clipped at the root; no route can scroll sideways.
- Added `min-width: 0` to flex text columns so long labels wrap instead of pushing the layout wide.
- Short-screen handling for onboarding and the processing screen.

## 3. Icons and the light theme

- All 25 icons redrawn on one grid: 24×24, 1.75 stroke, round caps and joins. The posture, grooming, water, settings and sparkle icons were the worst offenders and are replaced outright (grooming is now a razor, settings is a sliders control, progress is a bar chart).
- Light theme rebuilt: warmer paper background, deeper ochre accent, ink text at proper contrast.
- Accent surfaces (primary button, today's date chip, completed quest tick, scan button, selected tiles) now use theme-aware tokens, so text on gold is white in light mode and near-black in dark mode instead of unreadable both ways.
- Heatmap, progress bars, segmented thumb, ring gradient and the background wash all have light-mode variants. The score ring gets a deeper gradient so it is visible on paper.

## 4. Entrance animation plays once

The landing screen staggers its content in on first load only. Moving between steps now does a single 260 ms fade of the whole block, with no per-element stagger and no replay when you come back.

## 5. Other bugs fixed

- Clearing a quest no longer re-renders the whole home screen: the row, the counter, the streak line, the XP total and the rank bar update in place, so the scroll position holds and nothing re-animates.
- Counters and the score ring now land on their final value even if `requestAnimationFrame` never runs (background tab, reduced motion), instead of freezing mid-count.
- Navigating to another screen resets the scroll position.
- Streak, best streak, month count and heatmap ignore the internal bonus flag when counting cleared quests.
- The live capture chips update in place rather than being rebuilt on every frame, and the light and focus gates now analyse the real video frame instead of a default.
- Theme set to "System" now follows the OS when it changes.
- The boot-failure screen only takes over if the app never rendered; a later error no longer wipes a working screen.
- Old scans without a focus list no longer crash the results screen.
- The demo seeder no longer overwrites the chosen theme.
