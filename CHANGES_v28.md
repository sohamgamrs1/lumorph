# Lumorph — v28: the tab bar on Ascend, and names that fit

Three files: `app.js`, `styles.css`, rebuilt `Lumorph.html`.

## 1. The nav bar vanished on Ascend

The bar is only drawn for routes on a hardcoded list — `['home', 'progress', 'profile']` —
which I never updated when I added the tab. So Ascend rendered as a full-screen page with
no navigation, and the only way back was the browser.

The list now includes `ascend`. Verified: the bar stays, with four tabs and the scan
button.

## 2. Names

Onboarding enforced 2–12 characters; the **rename sheet did not**. It accepted up to 24
and silently fell back to "Friend" for an empty box, so a long name could push the
greeting out of shape.

- Rename is now 2–12, with the same messages onboarding uses: "Use at least 2
  characters." and "Keep it to 12 characters or fewer."
- The hint under the field says 2–12, so the rule is visible before you hit Save.
- Names over 8 characters render at 0.82× in the greeting, and long words break rather
  than overflow. A twelve-character name now sits on two lines without touching anything.

Checked with "Alexanderthe" — the longest allowed — on the home screen and the profile.
