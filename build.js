/* Build a single self-contained Lumorph.html:
   CSS and JS inlined so the app runs from file:// on any device,
   where browsers refuse to load sibling stylesheets and scripts. */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

let html = read('index.html');
const css = read('styles.css');
const engine = read('engine.js');
const app = read('app.js');

// 1. inline the stylesheet
html = html.replace(
  /<link rel="stylesheet" href="\.\/styles\.css" \/>/,
  '<style>\n' + css + '\n</style>'
);

// 2. drop the manifest and icon links (they need sibling files)
html = html.replace(/<link rel="manifest" href="\.\/manifest\.webmanifest" \/>\n?/, '');
html = html.replace(/<link rel="icon" href="\.\/icons\/icon-192\.png" \/>\n?/, '');
html = html.replace(/<link rel="apple-touch-icon" href="\.\/icons\/icon-192\.png" \/>\n?/, '');

// 3. inline the scripts
html = html.replace(
  /<script src="\.\/engine\.js"><\/script>/,
  '<script>\n' + engine + '\n</script>'
);
html = html.replace(
  /<script src="\.\/app\.js"><\/script>/,
  '<script>\n' + app + '\n</script>'
);

if (html.includes('src="./app.js"') || html.includes('href="./styles.css"')) {
  throw new Error('inlining failed: a relative reference survived');
}

const out = path.join(dir, '..', 'Lumorph.html');
fs.writeFileSync(out, html);
console.log('written', out, (html.length / 1024).toFixed(1) + ' KB');
