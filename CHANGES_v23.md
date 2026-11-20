# Lumorph — v23: the data can't disappear quietly any more

Five files: `app.js`, `styles.css`, rebuilt `Lumorph.html`, and the three icons.

## 1. Save no longer fails silently

`save()` caught a quota error and did nothing — so on a full browser the app would keep
working while quietly writing nothing. Now it sheds the oldest thumbnails, then the oldest
scans, and says so. Losing an old picture beats losing the write.

## 2. The browser is asked not to evict you

`navigator.storage.persist()` on boot. Chrome and Firefox honour it; Safari mostly
ignores it, which is why item 3 exists.

## 3. A backup reminder, and a way back

After seven days without a backup, home shows a card: **Back up your scans**. It writes a
JSON file to downloads and stamps the date.

**Settings → Restore from a backup** is the other half, which never existed. Pick a file,
see what it holds — "9 scans, started 12 Nov" — and confirm. It replaces everything.

## 4. An install prompt

`beforeinstallprompt` is captured and offered on home after the second scan, because an
installed app is exempt from the browser clearing your data. Dismissable, and it never
comes back if you say no.

## 5. Your scans, as pictures

The progress screen had a line chart and nothing else. There is now a strip of past scans
— photo, date, score — that scrolls sideways and opens any scan you tap. The thumbnails
were already being stored; they were just never shown together.

## 6. The icons

`icon-192`, `icon-512` and `maskable-512` are the new copper mark. The old ones were still
gold from the previous palette.

## Bugs found while building this

- **Every scan date was `Invalid Date`.** Scans store `ts`; I was reading `at`. The photo
  strip showed it immediately, and the same mistake had been quietly writing blank dates
  into the calibration CSV since v21.
- The scan object had **two `metrics` keys** — the raw one, then a rounded copy. Harmless
  because the second won, but it was one edit away from being a real bug.
- "1 photos".
