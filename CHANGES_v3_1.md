# Lumorph — v3.1 alignment fixes

Three files: `styles.css`, `app.js`, and the rebuilt `Lumorph.html`.

## 1. Page headers sat against the screen edge

`#topbar` lives outside `#view`, which is where the 22px page padding is applied. So every page title rendered flush against the left edge while the cards below it were correctly inset.

`#topbar` now carries the same horizontal padding as the page content, so the wordmark, "Your numbers / Progress" and "Account / Profile" all line up with the cards underneath, on every page and at every width.

## 2. The nav highlight drifted away from its tab

Two faults in the same element. The glow had no `left` origin, so its starting point was its static position inside a padded flex row; and the offset was then added on top of that, so the highlight landed at roughly double the offset and with the wrong width. The wider the label, the further off it looked.

It is now measured from real element rectangles, accounts for the bar's border, and re-measures when the webfonts finish loading and whenever the window resizes or rotates — because the label widths change once Inter replaces the fallback, which was the other half of the drift.

The tab bar's own side padding was also 16px against the page's 22px; it now follows the same variable.

## 3. Repeated and mis-sized icons in the profile

"Edit name", "Settings & privacy" and "How scores work" all used the same sliders icon, and the Focus row used the same two-star sparkle as the app's decorative mark.

Now: a pencil for Edit name, sliders for Settings, an info mark for the scoring page, a droplet for skin type and a target ring for focus. The two skin icons also go from 16px to 18px so they fill their tiles properly.
