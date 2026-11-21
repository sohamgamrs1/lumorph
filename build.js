#!/usr/bin/env node
/* Inline every asset into one file so the app also runs from file:// */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

let html = read('index.html');
const safe = (js) => js.replace(/<\/script>/gi, '<\\/script>');

// the single-file build has its scripts inline, which the shipped CSP forbids;
// drop the meta here only — the deployed version keeps it via vercel.json
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/i, '');

html = html.replace(/<link rel="stylesheet" href="\.\/styles\.css"\s*\/>/,
  () => '<style>\n' + read('styles.css') + '\n</style>');

for (const file of ['boot.js', 'i18n.js', 'engine.js', 'app.js']) {
  const re = new RegExp('<script src="\\./' + file.replace('.', '\\.') + '"></script>');
  if (!re.test(html)) { console.error('could not find tag for', file); process.exit(1); }
  html = html.replace(re, () => '<script>\n' + safe(read(file)) + '\n</script>');
}

fs.writeFileSync(path.join(root, 'Lumorph.html'), html);
console.log('written Lumorph.html', (Buffer.byteLength(html) / 1024).toFixed(1), 'KB');
