# Lumorph — v16: age stepper and the daily scan budget

Three files: `app.js`, `styles.css`, `privacy.html`, and the rebuilt `Lumorph.html`.

## 1. Age instead of a date of birth

The onboarding step is now a stepper: a big serif number between a minus and a plus.
The first tap lands on 18, then each tap moves one year. 13 is enforced — below it the
note turns red, Continue refuses, and the message says why. Nothing is guessed and no
calendar is involved.

The profile now stores `age`. Anyone who onboarded earlier keeps working: the profile
reads `age` when it exists and falls back to the stored birth date, so no one has to
redo onboarding.

Privacy copy updated to match — it says age, not birth date, and "will not accept an age
below 13" rather than the date version.

## 2. One scan a day

- A scan starts a **24 hour cooldown**.
- Promo codes add scans without shortening the wait: `LUMORPH` +1, `APEXDOCK` +2,
  `FADEXCO300`… correction: `FADEX300` +3.
- A credit is spent automatically when you scan during a cooldown, and the daily timer
  keeps running underneath.
- The scan screen refuses politely when the day is spent: "Next scan in 23h 40m", with the
  reason. The home button greys out to the same message.
- The scan screen shows how many bonus scans are left, when any are.

Verified end to end: onboarding with the stepper, a scan that sets the cooldown, the
second attempt blocked with a countdown, and the counter formatting fixed so it never
reads "23h 60m".
