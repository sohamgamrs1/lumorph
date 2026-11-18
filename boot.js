/* Lumorph boot guard: if the app cannot start, say so instead of a blank screen. */
// If anything fails to load, say so instead of showing a blank screen.
window.__bootFail = function (msg) {
  var d = document.getElementById('boot-error');
  if (!d) return;
  d.style.display = 'block';
  d.querySelector('.msg').textContent = msg;
};
window.addEventListener('error', function (e) {
  var v = document.getElementById('view');
  // only take over the screen if the app never rendered at all
  if (!v || v.children.length) return;
  if (e && e.message) window.__bootFail(e.message + (e.lineno ? ' \u2014 line ' + e.lineno : ''));
}, true);
setTimeout(function () {
  var v = document.getElementById('view');
  if (!v || !v.children.length) {
    window.__bootFail('The app did not start. If you opened this file directly, use the single-file build (Lumorph.html) instead.');
  }
}, 3000);
