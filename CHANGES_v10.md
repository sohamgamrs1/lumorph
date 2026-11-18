# Lumorph — v10: the endpoint stops hardcoding model names

One file: `api/rate.js`. Nothing else changed.

## What broke

Google retired `gemini-2.0-flash`, and the build was still falling back to it:

> This model models/gemini-2.0-flash is no longer available.

The default was `gemini-2.5-flash`, so that had been retired too — the fallback was
reached, and it was also gone. Two model retirements in one project is a pattern, not
bad luck, so the fix is not another hardcoded name.

## What it does now

1. Tries `GEMINI_MODEL` if you set one.
2. Tries `gemini-flash-latest`, Google's own alias for the current Flash model.
3. Tries the last known names.
4. If all of those are gone, **asks the API what exists** (`GET /v1beta/models`),
   ranks the results, filters out image, audio, TTS, live and preview variants, and
   tries the top three.
5. Caches whichever one answered, so the next request goes straight to it.

Tested against a stubbed Google: with the whole shortlist retired it discovered
`gemini-3.1-flash-lite` and answered 200; on the following request it went straight to
the cached model with no wasted calls.

The success response now includes the `model` field, so you can see which one answered.

## Also

The error text for a retired model no longer tells you to set `gemini-2.0-flash` (which
no longer exists). It says the model was retired and that this build resolves it
automatically.

## Not changed

Still on `generateContent`. Google now recommends the newer Interactions API for new
projects, but `generateContent` remains supported and there is no reason to migrate
mid-flight.
