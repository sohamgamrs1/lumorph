# Lumorph — v17: the vercel.json that was blocking every deploy

One file: `vercel.json`.

## What was wrong

The v14 SEO batch added this header rule:

    { "source": "/(og-image.png|icons/(.*))" }

Vercel validates `source` with path-to-regexp. A bare `(a|b)` alternation is not a valid
pattern, and nesting `(.*)` inside one is worse. The config was rejected at deploy time,
before the build started — which is why nothing appeared to deploy, and why creating a new
project failed at the import screen with:

    Header at index 2 has invalid `source` pattern "/(og-image.png|icons/(.*))".

## What it is now

    /(.*)   /index.html   /sw.js   /manifest.webmanifest
    /og-image.png   /icons/(.*)   /sitemap.xml   /robots.txt

Literal paths, plus one `(.*)` segment where a whole folder is meant. Same CSP, same
security headers, same cache rules — only the patterns changed.

## After you upload

1. Commit this file. The existing project should deploy on the commit.
2. Watch Deployments: Queued → Building → Ready.
3. Check the environment variables on whichever project you keep. A project created after
   the failed import has no `GEMINI_KEY`, so the AI read will report "not configured"
   until you add it and redeploy.
