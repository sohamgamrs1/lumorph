# Lumorph — v25: a routine that follows the scan

Three files: `app.js`, `styles.css`, rebuilt `Lumorph.html`.

## The routine engine

The routine used to be four fixed steps chosen from your profile. It is now built from
the **weakest signals in your last scan**.

Every metric is mapped to a group — tone evenness, redness, texture, shine, under-eye,
jaw and cheek definition, eye and brow area — and any metric that scored below 6.5 puts
its group into the plan, weakest first. A low angularity pillar adds the jaw group even
when no single measurement triggered it. "The floor" — cleanse, moisturise, water — is
always there.

Each step names the measurement it exists for, so nothing in the list is decoration:

- *Hold a steady calorie deficit* — "Jaw and cheekbone definition is the last place fat
  leaves. It is the biggest lever you have and the slowest."
- *Seven hours, same time nightly* — "The single largest lever on under-eye shadow.
  Creams are a distant fourth."
- *Blot, do not wash* — "Washing mid-day strips the barrier and the oil comes back harder."

The routine screen now shows **What needs work** with the score that triggered it, then
Morning / Evening / Through the day / Weekly, with ticks carried over from today's list.

## The daily list is derived, not fixed

Today's quests come from the same plan — the steps that repeat daily, capped at six. So
someone whose scan says texture gets a different list from someone whose scan says jaw
definition. Ticking still works the same way, and streaks still count.

## Calibration lab

**Settings → Calibration → Open the lab.** Every scan with measurements, newest first,
with a field to put your own score beside it. Progress is shown as "0 of 8". Export CSV
sits at the top.

## Camera check

**Settings → Troubleshooting → Camera check.** Reports secure context, getUserMedia
availability, installed or browser tab, whether the face model has loaded, screen size and
the user agent — plus a **Test camera** button that asks for the camera and reports the
resolution or the exact error name.

I cannot test the camera from here; this is the next best thing. If scanning misbehaves on
your phone, open this and send what it says.

## A bug found on the way

The lab rendered nothing at first: I passed an array to `append()`, which stringifies it
rather than mounting the elements. `h()` flattens arrays, `append()` does not. Wrapped.

## Note

The new routine and lab strings are English only. The Hindi and Bengali dictionaries do
not cover them yet, so those users see English on these two screens until the strings are
translated.
