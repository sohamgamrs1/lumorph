# Lumorph — v15: hardening

Six files. One is new: `package.json`.

## 1. Rate limiting

`/api/rate` is the only endpoint that costs money, so it is the only one worth attacking.

- **Per IP:** 6 a minute, 30 an hour.
- **Per instance:** 300 an hour across everyone, so a single warm instance cannot be made
  to spend without bound.
- **Origin check:** a browser request whose Origin is not this deployment is refused.
- **Retry-After** on every 429, and the message says how long to wait.

Verified: eight rapid calls from one address gave six 200s, then two 429s with a message;
a different address was unaffected.

**The limit you should know about:** those counters live in one serverless instance's
memory. Rotating IPs across cold starts defeats it. Real protection needs shared state —
Upstash or Vercel KV. Until then, set a spending cap on the Google Cloud project; that is
the backstop no application code can replace.

## 2. Input validation

Strict, and it returns sentences:

- JSON content type required, or 415.
- A single `image` field; any other field is rejected.
- The value must match a base64 JPEG/PNG/WebP data URL.
- Decoded size between 1KB and 2.5MB.
- The **magic bytes** are checked, so a file claiming to be a JPEG that is not one is
  refused.

All six paths tested, each with its own message.

## 3. Package version check

- `package.json` pins the runtime to Node 20 and records the app version, so the
  serverless runtime cannot drift under the function.
- The MediaPipe version lives in one constant used for both the module and its wasm, so
  the two can no longer disagree.
- The module is checked after loading: if `FaceLandmarker` or `FilesetResolver` is
  missing, it fails with a clear error instead of a silent no-camera screen.

## 4. Messages instead of codes

Every failure returns `{ ok: false, error: "<code>", message: "<sentence>" }`. The client
already showed `message`, so the user now sees "That photo is too large…" rather than a
status number. Success carries `ok: true`.

## 5. Privacy upgraded

A new section in both the public page and the in-app document: the IP address is
processed in memory for rate limiting only, never stored beside a photo, never logged,
and dropped when the window closes. Request bodies are not retained. Uploads are checked
before they leave the device.

## 6. Image upload limits

- Only JPEG, PNG and WebP accepted.
- Files over 12MB refused before they are read, with the actual size in the message.
- Sources over 12000px are not resized, to avoid a memory spike.
- The copy sent for an AI read is still resized to 768px.

Verified with a 13MB file and a .txt file: both refused with their own message, and a
normal scan still completes.
