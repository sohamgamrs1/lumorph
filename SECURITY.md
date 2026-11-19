# Lumorph — security notes

This file states plainly what is protected, what is not, and why. It is deliberately short, because most of the answer is one sentence: **Lumorph has no server, so there is nothing to break into — and nothing to protect from the person using it.**

## The threat model

| Threat | Protected? | Why |
| --- | --- | --- |
| Someone reading your scan data | Yes | It never leaves the device. There is no upload, no account, no database. |
| A breach exposing user data | Not applicable | There is no user data anywhere but the user's own browser. |
| Clickjacking / embedding Lumorph in a scam frame | Yes | `frame-ancestors 'none'` and `X-Frame-Options: DENY`. |
| A third-party script injected into the page | Largely | CSP restricts script sources to this origin and the MediaPipe CDN. |
| MIME confusion, referrer leakage, DNS prefetch | Yes | `nosniff`, `no-referrer`, `X-DNS-Prefetch-Control: off`. |
| Reading your redeem codes out of the source | Partly | Only salted hashes ship. See below. |
| Someone editing their own score in DevTools | **No** | And it cannot be prevented in any client-side app. |
| Someone republishing a modified copy of the app | **No** | The code is public by nature. |

## What cannot be done, and why

Every value in Lumorph — the score, the XP, the badges — is computed and stored in the user's own browser. Anyone can open DevTools, edit `localStorage`, and change their number. No amount of obfuscation changes that: the browser must be able to read the value, so the user can read it too, and the browser must be able to compute the score, so the user can recompute it differently.

Obfuscation raises the effort. It never closes the door. Shipping a 300KB obfuscator would make the code painful to read and would not stop a determined person for an afternoon.

What makes this acceptable here: **the numbers are only ever visible to the person who edited them.** There is no leaderboard, no sharing, no server, no prize. Cheating at Lumorph means lying to yourself in private, which is not a security problem — it is the same as not doing the scan.

## Rate limiting, and its honest limit

`/api/rate` is the only endpoint that can cost money, so it is the only one worth
attacking. It is defended in layers:

- **Per IP:** 6 requests a minute, 30 an hour.
- **Per instance:** 300 requests an hour across everyone, so one warm instance cannot
  be made to spend without bound.
- **Origin check:** a browser request whose Origin does not match the deployment is
  refused outright.
- **Strict input validation:** JSON content type, a single `image` field and nothing
  else, a base64 JPEG/PNG/WebP data URL, decoded bytes between 1KB and 2.5MB, and the
  file's magic bytes checked rather than trusting its label.
- **Every failure returns a sentence**, not a code, so a caller always knows what to fix.

The limit that cannot be fixed in code: the counters live in one serverless instance's
memory. A distributed attacker rotating IPs across cold starts is not stopped by this.
Real protection needs shared state — Upstash Redis or Vercel KV — which is the next step
if the key ever looks like it is being drained. Set a spending cap on the Google Cloud
project as well; that is the backstop no application code can replace.

## What is done

- **No secrets in the client.** There is no API key, no token, no database URL. Nothing to steal.
- **Strict transport and framing headers** in `vercel.json`: HSTS with preload, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `no-referrer`, a restrictive `Permissions-Policy`, COOP and CORP.
- **Content Security Policy** limiting scripts to this origin and `cdn.jsdelivr.net`, objects to none, base URI to none, forms to none. `'unsafe-eval'` is present because MediaPipe's WebAssembly glue requires it; with no user-generated markup anywhere in the app, the XSS surface it would normally open is close to zero.
- **No `innerHTML` with user data.** The only HTML written to the DOM is this app's own icon strings.
- **Redeem codes are salted hashes**, not plaintext, so viewing source does not hand them out.
- **Redemption is rate limited** to five wrong attempts, then a 60-second lock, so guessing is slow.
- **Each code works once per device.**

## The honest limit on redeem codes

A 4–8 character code space is small. With the hashes in hand, a script could try every combination in seconds, because there is no server to rate-limit the guesses — the rate limit lives in the same client the attacker controls.

If codes ever need to be genuinely secret or genuinely one-per-person, that requires a server: a small serverless function that holds the codes, checks them, and returns a signed receipt. That is the only real fix, and it is deliberately not part of this build.

Until then, treat codes as **fun and social, not as a security boundary.** They are there to reward people who watch your videos, not to protect anything of value.

## Reporting

If you find a genuine issue — something that exposes data, breaks the app for other people, or lets one person affect another person's account — tell me directly rather than posting it publicly.
