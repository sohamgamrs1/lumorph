# Lumorph — v14: findability and the security checklist

Eleven files. Six are new: `404.html`, `faq.html`, `privacy.html`, `robots.txt`,
`sitemap.xml`, `og-image.png`.

## Done

**1. Custom 404** — `404.html`, on brand, with real links back into the app, the FAQ and
the privacy page. Vercel serves it with a genuine 404 status for any unmatched path.

**2. A title on every page** — the app is a single page with routes, so the title is now
set per route: "Lumorph — your dashboard", "Progress — Lumorph", "Settings and privacy —
Lumorph" and so on. The static pages have their own.

**3. A description on every page** — same mechanism, and the Open Graph description is
kept in step so a shared link matches what the page is.

**4. Share preview** — `og-image.png` at 1200×630, drawn in the brand: score, headline,
pillar bars. Open Graph and Twitter card tags on the app and on all three static pages,
with `og:image:alt` describing the picture for anyone using a screen reader.

**5. Alt text** — there are no content images: the orb and marks are CSS, and the share
card and mesh are canvas. The one real image is the share preview, and it has descriptive
alt text.

**6. Internal links** — the 404 links to the app, the FAQ and privacy; every static page
has the same footer; the FAQ links back into the app. Descriptive link text throughout.

**7. Sitemap** — `sitemap.xml` lists the three real public pages. 404 and the API are
deliberately excluded. Submit it at Search Console: `https://lumorph.vercel.app/sitemap.xml`.

**8. robots.txt** — allows everything except `/api/`, and points at the sitemap. No
leftover `Disallow: /`.

**9. HTTPS** — Vercel redirects http to https automatically and HSTS with preload is
already set in `vercel.json`.

**13. Privacy policy** — a public `privacy.html` matching what is actually collected, and
the in-app copy updated to match.

**14. FAQ** — `faq.html` with ten real questions, including the unflattering ones: what it
is not, why scores move, what the AI read sends and where.

**12. Analytics** — built but **off**. A consent bar and a gated GA4 loader exist, but
nothing loads unless a measurement id is set in the `lumorph-analytics` meta tag, and even
then only after the visitor agrees. CSP updated to allow the host when it is switched on.

## Not done, on purpose

**10. Form spam protection** — there are no public forms. The one endpoint, `/api/rate`,
already has a per-IP rate limit and a 3MB cap. A honeypot needs a form to hide in.

**11. Thank-you page** — no forms, so nothing to thank anyone for.

**15. Reviews** — there are no reviews. I will not write placeholder testimonials; that
is the one item on the list that would make the site less honest, not more.
