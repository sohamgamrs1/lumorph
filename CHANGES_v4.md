# Lumorph — v4: redeem codes, rewards, hardening

Seven files. Three are new: `boot.js`, `vercel.json`, `SECURITY.md`. Add them to the repo root next to the others.

## 1. Redeem codes

- Codes are 4–8 characters, A–Z and 0–9 only, case-insensitive.
- **The codes themselves are not in the source.** Only a salted 64-bit digest of each is stored, so viewing source does not hand them out.
- Five wrong attempts locks entry for 60 seconds.
- Each code works once per device.
- Validation messages: too short, too long, not valid, already used, too many attempts.

Rewards:

| Code | XP | Reward |
| --- | --- | --- |
| `LUMORPH` | 100 | Founder badge |
| `FADEX300` | 300 | Supporter badge, scan history raised from 60 to 200 scans |
| `APEXDOCK` | 200 | Insider badge |

Badges appear as pills under your name on the profile screen.

## 2. Security

`vercel.json` now sends, on every response:

- `Content-Security-Policy` — scripts limited to this origin and the MediaPipe CDN, objects and base URI to none, forms to none, framing to none.
- `Strict-Transport-Security` with preload
- `X-Frame-Options: DENY` and `frame-ancestors 'none'` — no clickjacking
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy` — camera allowed for self, everything else off
- `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`
- `no-cache` on the HTML, service worker and manifest so a deploy is picked up immediately

The inline boot guard moved to `boot.js` so the strict CSP does not block it.

`SECURITY.md` states the threat model in plain language: what is protected, what cannot be protected in any client-side app, and why.

## What this does NOT do

It does not stop someone editing their own score in DevTools, and no client-side technique can. It does not make redeem codes secret — a 4–8 character space can be brute-forced locally, because the rate limit lives in the same browser the attacker controls. Both points are spelled out in `SECURITY.md` rather than glossed over.
