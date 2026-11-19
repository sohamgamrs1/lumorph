# Lumorph — v18: Node 26

One file: `package.json`.

## The error

    Node.js Version "20.x" is discontinued and must be upgraded.
    Please set "engines": { "node": "26.x" }

That pin was mine, added in v15 when I wanted to stop the serverless runtime drifting.
It drifted anyway — by being retired.

## The fix

`engines.node` is now `26.x`, and the `build` script is gone. That script pointed at
`build.js`, which only produces the single-file `Lumorph.html`; on Vercel it was a way for
the build to fail for no benefit.

## Why the function will run fine on 26

`api/rate.js` uses three things: `Buffer`, the global `fetch`, and `process.env`. No
dependencies, no native modules, no framework. There is nothing in it that a Node upgrade
can break.

## If it still complains after this

Vercel also carries a Node version at the project level. Check
**Project → Settings → General → Node.js Version** and set it to 26.x there. The two
settings must agree; `package.json` cannot override a project pinned to an older major.
