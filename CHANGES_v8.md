# Lumorph — v8: the AI read

Six files. One is new and one is a new folder: `api/rate.js`.

## What it does

Geometry measures proportion. It cannot tell a handsome face with bad skin from an
unremarkable one with good bones. A vision model can, so the app now offers a second
opinion — and blends it with the geometric score.

- **Off by default.** A toggle in Settings, plus a prompt on every result.
- When on, each scan sends **one photo** to Gemini and gets back an attractiveness score,
  a harmony score, a skin score, a tier name, up to three strengths and up to three
  things worth working on.
- The result screen shows it as a **Second opinion** card, and the overall score becomes
  **50% geometric, 50% model**. The tier follows the blended number.
- It arrives asynchronously: the geometric result appears instantly, the card fills in
  a second or two later, without moving the page.
- If no face is found, or the call fails, the card says so and offers a retry.

## The key

It never touches the client. `api/rate.js` runs on Vercel, reads `GEMINI_KEY` from the
environment, and is the only thing that talks to Google.

Hardening in the function:

- POST only, 3MB payload cap, base64 validated.
- Per-IP rate limit of 12 reads a minute, in memory per warm instance.
- Model name configurable via `GEMINI_MODEL`, with an automatic fallback to
  `gemini-2.0-flash` if the configured one is not found.
- The key is never logged and never returned, including on error paths.
- The prompt forbids identity characteristics, insults, surgery suggestions and medical
  advice, and forces a calibrated scale where a normal, pleasant person scores 5.

## Privacy

The app used to say "nothing is uploaded". That is now conditional, and the copy changed
in three places to match: the scan footer, the result card, and the privacy document.

While the AI read is off, nothing leaves the device. While it is on, one photo per scan
is sent to Google. Turn it off and it stops.

## Setup

1. Free key at `aistudio.google.com/apikey`.
2. Vercel, Settings, Environment Variables: `GEMINI_KEY`.
3. Redeploy. The `api/` folder becomes a serverless function automatically.
