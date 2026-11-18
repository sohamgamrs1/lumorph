/* ============================================================
   Lumorph — app
   Local-first PWA. No backend, no AI, no subscription.
   ============================================================ */
(function () {
  'use strict';

  const E = window.LumorphEngine;
  const I18N = window.LumorphI18n;
  const T = (s) => (I18N ? I18N.t(s) : s);
  const num = (v, dp, suffix) => (v == null || !isFinite(v)) ? '\u2014' : Number(v).toFixed(dp == null ? 1 : dp) + (suffix || '');
  const txt = (v, fallback) => (v == null || v === '' || v === 'null' || v === 'undefined') ? (fallback == null ? '\u2014' : fallback) : v;
  const $ = (s, r) => (r || document).querySelector(s);
  const app = $('#app');
  const view = $('#view');
  const topbar = $('#topbar');
  const tabbar = $('#tabbar');
  const toastEl = $('#toast');
  const sheetEl = $('#sheet');

  /* ---------------- mini hyperscript ---------------- */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    props = props || {};
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') {
        for (const p in v) {
          if (p.startsWith('--')) el.style.setProperty(p, v[p]);
          else el.style[p] = v[p];
        }
      }
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    kids.flat(9).forEach((k) => {
      if (k == null || k === false) return;
      el.append(k.nodeType ? k : document.createTextNode(String(k)));
    });
    return el;
  }

  /* ---------------- icons ---------------- */
  /* One grid: 24x24, 1.75 stroke, round caps and joins. */
  const SVG = (inner, fill) =>
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="' + (fill ? 'currentColor' : 'none') +
    '" stroke="' + (fill ? 'none' : 'currentColor') +
    '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';

  const I = {
    home: SVG('<path d="M3.6 10.4 12 3.8l8.4 6.6V19a1.4 1.4 0 0 1-1.4 1.4H5A1.4 1.4 0 0 1 3.6 19z"/><path d="M9.6 20.4v-5.8h4.8v5.8"/>'),
    progress: SVG('<path d="M4.2 20V13.2"/><path d="M9.6 20V8.2"/><path d="M15 20v-5.4"/><path d="M20.4 20V4.6"/>'),
    profile: SVG('<circle cx="12" cy="8.4" r="3.7"/><path d="M4.6 20.4c.6-3.7 3.6-5.9 7.4-5.9s6.8 2.2 7.4 5.9"/>'),
    scan: SVG('<path d="M4.2 8.8V6.2A2 2 0 0 1 6.2 4.2h2.6"/><path d="M15.2 4.2h2.6a2 2 0 0 1 2 2v2.6"/><path d="M19.8 15.2v2.6a2 2 0 0 1-2 2h-2.6"/><path d="M8.8 19.8H6.2a2 2 0 0 1-2-2v-2.6"/><circle cx="12" cy="12" r="3.1"/>'),
    back: SVG('<path d="M14.6 5.4 8 12l6.6 6.6"/>'),
    chev: SVG('<path d="M9.4 5.4 16 12l-6.6 6.6"/>'),
    check: SVG('<path d="M4.6 12.7 9.4 17.5 19.4 6.9"/>'),
    close: SVG('<path d="M6.3 6.3 17.7 17.7"/><path d="M17.7 6.3 6.3 17.7"/>'),
    upload: SVG('<path d="M12 15.4V4"/><path d="M7.7 8.3 12 4l4.3 4.3"/><path d="M4.2 14.8v3.4a2 2 0 0 0 2 2h11.6a2 2 0 0 0 2-2v-3.4"/>'),
    camera: SVG('<rect x="3.4" y="7.4" width="17.2" height="12" rx="2.8"/><path d="M8.5 7.4 9.9 4.8h4.2l1.4 2.6"/><circle cx="12" cy="13.3" r="3.1"/>'),
    sparkle: SVG('<path d="M10.6 3.6c.5 3.1 1.9 4.5 5 5-3.1.5-4.5 1.9-5 5-.5-3.1-1.9-4.5-5-5 3.1-.5 4.5-1.9 5-5z"/><path d="M17.8 13.2c.3 1.8 1.1 2.6 2.9 2.9-1.8.3-2.6 1.1-2.9 2.9-.3-1.8-1.1-2.6-2.9-2.9 1.8-.3 2.6-1.1 2.9-2.9z"/>', true),
    drop: SVG('<path d="M12 3.6c3.1 3.9 5.3 6.6 5.3 9.3a5.3 5.3 0 0 1-10.6 0c0-2.7 2.2-5.4 5.3-9.3z"/>'),
    moon: SVG('<path d="M20.2 14.7A8.5 8.5 0 0 1 9.3 3.8a8.6 8.6 0 1 0 10.9 10.9z"/>'),
    sun: SVG('<circle cx="12" cy="12" r="4.1"/><path d="M12 2.7v2.2"/><path d="M12 19.1v2.2"/><path d="M2.7 12h2.2"/><path d="M19.1 12h2.2"/><path d="M5.5 5.5 7.1 7.1"/><path d="M16.9 16.9l1.6 1.6"/><path d="M18.5 5.5 16.9 7.1"/><path d="M7.1 16.9 5.5 18.5"/>'),
    water: SVG('<path d="M6.6 5.4h10.8l-1 12.8a2 2 0 0 1-2 1.9H9.6a2 2 0 0 1-2-1.9z"/><path d="M7 10.8h10"/>'),
    posture: SVG('<circle cx="12" cy="4.9" r="2.2"/><path d="M12 7.5v7.1"/><path d="M8.5 9.7h7"/><path d="M12 14.6 9.5 20.7"/><path d="M12 14.6l2.5 6.1"/>'),
    groom: SVG('<path d="M7.2 4.4h9.6a1.4 1.4 0 0 1 1.4 1.4v3H5.8v-3a1.4 1.4 0 0 1 1.4-1.4z"/><path d="M12 8.8v9.4"/><path d="M9.2 19.6h5.6"/>'),
    refresh: SVG('<path d="M19.8 12a7.8 7.8 0 1 1-2.3-5.5"/><path d="M19.9 3.9v5.2h-5.2"/>'),
    gear: SVG('<path d="M4 7.6h9.2"/><path d="M18.4 7.6h1.6"/><path d="M4 16.4h1.6"/><path d="M10.8 16.4H20"/><circle cx="15.8" cy="7.6" r="2.2"/><circle cx="8.2" cy="16.4" r="2.2"/>'),
    shield: SVG('<path d="M12 3.4 19 5.9v5.7c0 4.3-2.9 7.4-7 9-4.1-1.6-7-4.7-7-9V5.9z"/><path d="M9.2 11.8l2 2 3.6-3.8"/>'),
    download: SVG('<path d="M12 3.8v11.4"/><path d="M7.7 11 12 15.3 16.3 11"/><path d="M4.2 20h15.6"/>'),
    trash: SVG('<path d="M4.6 6.8h14.8"/><path d="M9.4 6.8V4.5h5.2v2.3"/><path d="M6.7 6.8l.9 12.3a1.9 1.9 0 0 0 1.9 1.7h5a1.9 1.9 0 0 0 1.9-1.7l.9-12.3"/><path d="M10.4 10.6v6.3"/><path d="M13.6 10.6v6.3"/>'),
    info: SVG('<circle cx="12" cy="12" r="8.4"/><path d="M12 11.3v5.1"/><circle cx="12" cy="7.9" r="1" fill="currentColor" stroke="none"/>'),
    bolt: SVG('<path d="M13.4 2.6 5.2 13.4h5.6l-.9 8 8.2-10.8h-5.6z"/>', true),
    bell: SVG('<path d="M12 3.6a5.6 5.6 0 0 0-5.6 5.6c0 4.2-1.3 5.7-2 6.3h15.2c-.7-.6-2-2.1-2-6.3A5.6 5.6 0 0 0 12 3.6z"/><path d="M9.7 19a2.5 2.5 0 0 0 4.6 0"/>'),
    external: SVG('<path d="M14 4.5h5.5V10"/><path d="M19.4 4.6 11 13"/><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'),
    sigma: SVG('<path d="M17.5 5.5H7l5.5 6.5L7 18.5h10.5"/>'),
    doc: SVG('<path d="M6.6 3.8h6.6l4.4 4.4v12H6.6z"/><path d="M13.2 3.8v4.4h4.4"/><path d="M9.4 12.2h5.2"/><path d="M9.4 15.6h5.2"/>'),
    terms: SVG('<path d="M4 6.6h9.5"/><path d="M4 11.6h6.5"/><path d="M4 16.6h4.5"/><path d="M14.2 15.4l2.1 2.1 4.1-4.6"/>'),
    person: SVG('<circle cx="12" cy="8.1" r="3.3"/><path d="M5.4 20c.7-3.4 3.3-5.4 6.6-5.4s5.9 2 6.6 5.4"/>'),
    gift: SVG('<rect x="3.8" y="9.4" width="16.4" height="3.6" rx="1"/><path d="M5.6 13v7.4h12.8V13"/><path d="M12 9.4v11"/><path d="M12 9.4C10.4 5.8 8.9 5.2 7.7 6c-1.4.8-1 3.4 4.3 3.4z"/><path d="M12 9.4c1.6-3.6 3.1-4.2 4.3-3.4 1.4.8 1 3.4-4.3 3.4z"/>'),
    braces: SVG('<path d="M9.2 4.4H7.6A1.6 1.6 0 0 0 6 6v3.1c0 1-.6 1.9-1.6 2.2v1.4c1 .3 1.6 1.2 1.6 2.2V18a1.6 1.6 0 0 0 1.6 1.6h1.6"/><path d="M14.8 4.4h1.6A1.6 1.6 0 0 1 18 6v3.1c0 1 .6 1.9 1.6 2.2v1.4c-1 .3-1.6 1.2-1.6 2.2V18a1.6 1.6 0 0 1-1.6 1.6h-1.6"/>'),
    table: SVG('<rect x="3.6" y="5" width="16.8" height="14" rx="2.2"/><path d="M3.6 10h16.8"/><path d="M9.6 10v9"/>'),
    image: SVG('<rect x="3.6" y="5.2" width="16.8" height="13.6" rx="2.4"/><circle cx="8.7" cy="10" r="1.3"/><path d="M4.6 17.2l4.5-4.3 3.2 2.8 3-2.5 4.1 3.6"/>'),
    flip: SVG('<path d="M12 3.6v16.8"/><path d="M9.2 6.6 4.6 12l4.6 5.4z"/><path d="M14.8 6.6 19.4 12l-4.6 5.4z"/>'),
    clock: SVG('<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l3 1.9"/>'),
    mesh: SVG('<path d="M12 3.2 4.4 7.6v8.8L12 20.8l7.6-4.4V7.6z"/><path d="M12 3.2v17.6"/><path d="M4.4 7.6 12 12l7.6-4.4"/><path d="M4.4 16.4 12 12l7.6 4.4"/>'),
    globe: SVG('<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6c2.2 2.3 3.3 5.2 3.3 8.4s-1.1 6.1-3.3 8.4c-2.2-2.3-3.3-5.2-3.3-8.4S9.8 5.9 12 3.6z"/>'),
    share: SVG('<circle cx="17.4" cy="5.6" r="2.5"/><circle cx="6.6" cy="12" r="2.5"/><circle cx="17.4" cy="18.4" r="2.5"/><path d="M8.8 10.9 15.2 6.7"/><path d="M8.8 13.1l6.4 4.2"/>'),
    report: SVG('<path d="M6.6 3.8h6.6l4.4 4.4v12H6.6z"/><path d="M13.2 3.8v4.4h4.4"/><path d="M9.4 16.6v-3.4M12 16.6v-5.6M14.6 16.6v-2"/>'),
    pencil: SVG('<path d="M4.6 19.4l.9-4.2L15.9 4.8a2 2 0 0 1 2.8 0l.5.5a2 2 0 0 1 0 2.8L8.8 18.5z"/><path d="M14.6 6.1l3.3 3.3"/>'),
    target: SVG('<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>')
  };

  /* ---------------- store ---------------- */
  const KEY = 'lumorph.v2';
  const RANKS = [
    { name: 'Newbie', at: 0 }, { name: 'Grinder', at: 500 }, { name: 'Sharp', at: 1500 },
    { name: 'Polished', at: 3500 }, { name: 'Luminous', at: 7000 }, { name: 'Apex', at: 12000 }
  ];
  /* Redeem codes.
     Only a salted 64-bit digest of each code is in this file, so reading the
     source does not reveal a code. It cannot stop a determined brute force of
     a 4-8 character space - see SECURITY.md for what this does and does not do. */
  const CODE_SALT = 'lm$7k2p';
  const CODES = {
    bdf9dd71b2e1a7ae: { xp: 100, badge: 'founder', label: 'Founder' },
    '0c29712191afafb7': { xp: 300, badge: 'supporter', label: 'Supporter', perk: 'history' },
    e5d1f87df1bbabe3: { xp: 200, badge: 'insider', label: 'Insider' }
  };
  function digest(str) {
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 ^= c; h1 = Math.imul(h1, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ c, 2246822519) >>> 0;
      h2 = ((h2 << 13) | (h2 >>> 19)) >>> 0;
    }
    return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
  }

  const QUESTS = [
    { id: 'am', label: T('Morning skincare'), xp: 20, icon: 'drop' },
    { id: 'pm', label: T('Night skincare'), xp: 20, icon: 'moon' },
    { id: 'sleep', label: T('Sleep 7+ hours'), xp: 15, icon: 'moon' },
    { id: 'water', label: T('Drink 2L water'), xp: 10, icon: 'water' },
    { id: 'posture', label: T('Posture check'), xp: 10, icon: 'posture' },
    { id: 'groom', label: T('Grooming'), xp: 10, icon: 'comb' }
  ];
  const WEEKLY = { id: 'rescan', label: T('Weekly re-scan'), xp: 100, icon: 'refresh' };
  const BADGES = [
    { id: 'founder', label: 'Founder' },
    { id: 'supporter', label: 'Supporter' },
    { id: 'insider', label: 'Insider' }
  ];

  function blank() {
    return {
      v: 2, onboarded: false, profile: null, scans: [], quests: {},
      xp: 0, theme: 'dark', settings: { mirror: 'auto' }, consent: null, created: Date.now()
    };
  }
  let S = blank();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) S = Object.assign(blank(), JSON.parse(raw));
    } catch (e) { /* private mode: run in memory */ }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* quota */ }
  }
  const todayKey = (d) => {
    const x = d ? new Date(d) : new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  };
  const dayQuests = (k) => (S.quests[k || todayKey()] = S.quests[k || todayKey()] || {});
  const lastScan = () => (S.scans.length ? S.scans[S.scans.length - 1] : null);
  const rankOf = (xp) => {
    let r = RANKS[0];
    RANKS.forEach((x) => { if (xp >= x.at) r = x; });
    const next = RANKS[RANKS.indexOf(r) + 1] || null;
    return { ...r, next, pct: next ? (xp - r.at) / (next.at - r.at) : 1 };
  };
  function streak() {
    let n = 0;
    const d = new Date();
    for (let i = 0; i < 400; i++) {
      const k = todayKey(d);
      const q = S.quests[k] || {};
      const done = QUESTS.filter((x) => q[x.id]).length;
      if (done >= 1) { n++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return n;
  }
  function bestStreak() {
    const keys = Object.keys(S.quests).filter((k) => QUESTS.some((x) => S.quests[k][x.id])).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach((k) => {
      if (prev) {
        const a = new Date(prev), b = new Date(k);
        const gap = Math.round((b - a) / 86400000);
        run = gap === 1 ? run + 1 : 1;
      } else run = 1;
      best = Math.max(best, run);
      prev = k;
    });
    return best;
  }

  /* ---------------- motion ---------------- */
  const raf = (fn) => requestAnimationFrame(fn);
  function fillBars(root) {
    const bars = (root || view).querySelectorAll('.bar');
    raf(() => raf(() => setTimeout(() => bars.forEach((b) => b.classList.add('in')), 140)));
  }
  function reveal(root) {
    const nodes = (root || view).querySelectorAll('.rise');
    raf(() => raf(() => nodes.forEach((n) => n.classList.add('in'))));
  }
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animateNumber(el, to, opts) {
    const o = opts || {};
    const from = o.from == null ? 0 : o.from;
    const dur = o.dur || 900;
    const dp = o.dp == null ? 1 : o.dp;
    const write = (v) => { el.textContent = dp === 0 ? String(Math.round(v)) : v.toFixed(dp); };
    if (reduced() || from === to) { write(to); return; }

    let done = false;
    const start = performance.now();
    function frame(t) {
      if (done) return;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      write(from + (to - from) * e);
      if (p >= 1) { done = true; write(to); return; }
      raf(frame);
    }
    raf(frame);
    /* rAF stops in a background tab: land on the final value regardless */
    setTimeout(() => { if (!done) { done = true; write(to); } }, dur + 120);
  }
  function animateRing(circle, pct, opts) {
    const o = opts || {};
    const r = parseFloat(circle.getAttribute('r'));
    const c = 2 * Math.PI * r;
    const land = () => {
      circle.style.strokeDasharray = c;
      circle.style.strokeDashoffset = c * (1 - pct);
    };
    if (reduced()) { land(); return; }
    circle.style.strokeDasharray = c;
    circle.style.strokeDashoffset = c;
    const dur = o.dur || 1100;
    const start = performance.now();
    const to = c * (1 - pct);
    let done = false;
    function frame(t) {
      if (done) return;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      circle.style.strokeDashoffset = c - (c - to) * e;
      if (p >= 1) { done = true; land(); return; }
      raf(frame);
    }
    raf(frame);
    setTimeout(() => { if (!done) { done = true; land(); } }, dur + 120);
  }
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  function haptic(ms) { if (navigator.vibrate) try { navigator.vibrate(ms || 8); } catch (e) {} }

  /* ---------------- sheet ---------------- */
  function openSheet(content) {
    sheetEl.innerHTML = '';
    sheetEl.append(
      h('div', { class: 'scrim', onclick: closeSheet }),
      h('div', { class: 'sheet', role: 'dialog' }, h('div', { class: 'grab' }), content)
    );
    sheetEl.setAttribute('aria-hidden', 'false');
    raf(() => sheetEl.classList.add('open'));
  }
  function closeSheet() {
    sheetEl.classList.remove('open');
    sheetEl.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!sheetEl.classList.contains('open')) sheetEl.innerHTML = ''; }, 340);
  }

  /* ---------------- router ---------------- */
  let route = 'home';
  let navTimer = null;
  const TABS = ['home', 'progress', 'profile'];
  const ROUTES = {};

  function go(name, opts) {
    stopCam();
    route = name;
    if (navTimer) clearTimeout(navTimer);
    view.classList.remove('enter');
    view.classList.add('leave');
    navTimer = setTimeout(() => {
      navTimer = null;
      paint(name, opts || {});
      view.classList.remove('leave');
      view.classList.add('enter');
    }, 150);
    if (location.hash !== '#/' + name) history.pushState({ r: name }, '', '#/' + name);
  }
  function paint(name, opts) {
    view.innerHTML = '';
    topbar.innerHTML = '';
    const r = ROUTES[name] || ROUTES.home;
    r(view, opts);
    const isTab = TABS.includes(name);
    view.classList.toggle('no-tabs', name === 'onboarding' || name === 'processing' || name === 'scan');
    paintTabbar(isTab ? name : '');
    if (isTab) paintTopbar(name);
    window.scrollTo(0, 0);
    reveal(view);
    fillBars(view);
  }
  window.addEventListener('popstate', (e) => {
    const name = (e.state && e.state.r) || (location.hash || '').replace('#/', '') || 'home';
    if (name !== route) go(name, { fromHistory: true });
  });

  function positionTabGlow() {
    const inner = tabbar.querySelector('.inner');
    if (!inner) return;
    const glow = inner.querySelector('.glow');
    const btn = inner.querySelector('button.active');
    if (!glow) return;
    if (!btn) { glow.style.width = '0px'; glow.style.opacity = '0'; return; }
    const ir = inner.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const border = inner.clientLeft || 0;
    glow.style.opacity = '1';
    glow.style.width = Math.max(0, br.width - 8) + 'px';
    glow.style.transform = 'translate3d(' + (br.left - ir.left - border + 4) + 'px,0,0)';
  }

  function repaintThumbs() {
    positionTabGlow();
    document.querySelectorAll('.segmented').forEach((seg) => {
      const thumb = seg.querySelector('.thumb');
      const btn = seg.querySelector('button[aria-selected="true"]');
      if (!thumb || !btn) return;
      const sr = seg.getBoundingClientRect();
      const br = btn.getBoundingClientRect();
      const border = seg.clientLeft || 0;
      thumb.style.width = br.width + 'px';
      thumb.style.transform = 'translate3d(' + (br.left - sr.left - border - 4) + 'px,0,0)';
    });
  }

  window.addEventListener('resize', repaintThumbs);
  window.addEventListener('orientationchange', () => setTimeout(repaintThumbs, 260));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(repaintThumbs).catch(() => {});

  function paintTopbar(name) {
    if (name === 'home') {
      topbar.append(
        h('div', { class: 'topbar' },
          h('div', { class: 'brandmark' }, h('span', { class: 'orb-dot' }), 'Lumorph'),
          h('div', { class: 'grow' }),
          h('button', { class: 'icon-btn', 'aria-label': T('Profile'), onclick: () => go('profile') },
            h('span', { html: I.profile, style: { width: '20px', height: '20px', display: 'grid' } }))
        )
      );
    } else if (name === 'progress') {
      topbar.append(h('div', { class: 'topbar' },
        h('div', {}, h('p', { class: 'eyebrow' }, T('Your numbers')), h('h1', { class: 'display md' }, T('Progress')))));
    } else if (name === 'profile') {
      topbar.append(h('div', { class: 'topbar' },
        h('div', {}, h('p', { class: 'eyebrow' }, 'Account'), h('h1', { class: 'display md' }, T('Profile')))));
    }
  }

  function paintTabbar(active) {
    tabbar.innerHTML = '';
    if (!active) { tabbar.classList.add('hide'); return; }
    tabbar.classList.remove('hide');
    const items = [
      { id: 'home', label: T('Home'), icon: I.home },
      { id: 'progress', label: T('Progress'), icon: I.progress },
      { id: 'profile', label: T('Profile'), icon: I.profile }
    ];
    const inner = h('div', { class: 'inner' });
    const glow = h('div', { class: 'glow' });
    inner.append(glow);
    items.forEach((it) => {
      const b = h('button', {
        class: active === it.id ? 'active' : '', onclick: () => go(it.id)
      }, h('span', { html: it.icon, style: { display: 'grid', width: '20px', height: '20px' } }), it.label);
      b.dataset.id = it.id;
      inner.append(b);
    });
    const scan = h('button', {
      class: 'scan-fab', onclick: () => go('scan')
    }, h('span', { html: I.scan, style: { display: 'grid' } }), T('Scan'));
    inner.append(scan);
    tabbar.append(inner);

    raf(positionTabGlow);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionTabGlow).catch(() => {});
  }

  /* ============================================================
     VIEWS
     ============================================================ */

  /* ---------- onboarding ---------- */
  const SKIN_TYPES = [
    { id: 'balanced', t: T('Balanced'), s: 'Comfortable, rarely shiny or tight' },
    { id: 'oily', t: T('Oily / shine'), s: 'Shine by midday, visible pores' },
    { id: 'acne', t: T('Acne-prone'), s: 'Frequent breakouts or congestion' },
    { id: 'dry', t: T('Dry / dehydrated'), s: 'Tight, flaky or dull patches' },
    { id: 'sensitive', t: T('Sensitive / redness'), s: 'Reacts easily, flushes often' },
    { id: 'dark', t: T('Dark spots / scars'), s: 'Marks left behind by old breakouts' }
  ];
  const CONCERNS = [
    { id: 'maintenance', t: T('General maintenance'), s: 'Keep it clear and steady' },
    { id: 'clarity', t: T('Clearer skin'), s: 'Fewer breakouts, less congestion' },
    { id: 'even', t: T('Even tone'), s: 'Fade marks, even the complexion' },
    { id: 'eyes', t: T('Under-eye area'), s: 'Shadow and puffiness' },
    { id: 'definition', t: T('Facial definition'), s: 'Jaw, cheekbones, less puffiness' },
    { id: 'hair', t: T('Hair and grooming'), s: 'Cut, styling, brow upkeep' }
  ];

  let onb = null;
  const ONB_STEPS = 7;
  const NAME_MAX = 12;
  const MIN_AGE = 13;

  ROUTES.onboarding = function () {
    if (!onb) {
      onb = {
        step: 0,
        name: (S.profile && S.profile.name) || '',
        gender: (S.profile && S.profile.gender) || '',
        birth: (S.profile && S.profile.birth) || '',
        height: (S.profile && S.profile.height) || 175,
        unit: 'cm',
        skin: (S.profile && S.profile.skin) || [],
        concerns: (S.profile && S.profile.concerns) || [],
        error: '',
        seenAnim: false
      };
    }
    onb.error = '';
    renderOnb();
  };

  /* Every step is validated on Continue, with a message that says what to do. */
  function onbValidate(step) {
    if (step === 0) {
      const n = (onb.name || '').trim();
      if (!n) return 'Enter your first name to continue.';
      if (n.length < 2) return 'That name is too short \u2014 at least 2 characters.';
      if (n.length > NAME_MAX) return 'Keep your name to ' + NAME_MAX + ' characters or fewer.';
      if (/[0-9]/.test(n)) return 'Names cannot contain numbers.';
      return '';
    }
    if (step === 1) return onb.gender ? '' : 'Choose one so the right reference ranges are used.';
    if (step === 2) {
      if (!onb.birth) return 'Add your date of birth to continue.';
      const age = ageFrom(onb.birth);
      if (!isFinite(age) || age < 0) return 'That date is in the future.';
      if (age > 110) return 'That date does not look right.';
      if (age < MIN_AGE) return 'You must be ' + MIN_AGE + ' or older to use Lumorph.';
      return '';
    }
    if (step === 3) {
      return (onb.height >= 120 && onb.height <= 230) ? '' : 'Pick a height between 120 and 230 cm.';
    }
    if (step === 4) return onb.skin.length ? '' : 'Pick at least one skin type.';
    if (step === 5) return onb.concerns.length ? '' : 'Pick at least one focus.';
    return '';
  }

  function onbBlocked() {
    for (let s = 0; s <= 5; s++) {
      const e = onbValidate(s);
      if (e) { onb.step = s; return e; }
    }
    return '';
  }

  function renderOnb() {
    view.innerHTML = '';
    topbar.innerHTML = '';

    const first = !onb.seenAnim;
    const body = h('div', { class: 'body' });
    const errorEl = h('p', { class: 'field-error' + (onb.error ? ' on' : ''), role: 'alert' }, onb.error || '');
    const foot = h('div', { class: 'foot' });

    const backBtn = onb.step > 0
      ? h('button', {
          class: 'icon-btn ghost', 'aria-label': 'Back', onclick: () => {
            onb.step--; onb.error = ''; renderOnb();
          }
        }, h('span', { html: I.back, style: { display: 'grid', width: '20px', height: '20px' } }))
      : h('span', { class: 'icon-btn ghost', 'aria-hidden': 'true', style: { visibility: 'hidden' } });

    const stepsBar = h('div', { class: 'steps', style: { flex: '1' } },
      Array.from({ length: ONB_STEPS }, (_, i) =>
        h('i', { class: i <= onb.step ? (i === onb.step ? 'now' : 'done') : '' })));

    const wrap = h('div', { class: 'onb' + (first ? '' : ' instant') + (first ? '' : ' step-in') },
      h('div', { class: 'row gap-12', style: { alignItems: 'center' } }, backBtn, stepsBar),
      body, errorEl, foot);

    /* helpers ------------------------------------------------------------- */
    const rise = (i) => first ? { '--i': i } : {};
    const riseCls = (i) => 'rise' + (first ? '' : ' in');

    function clearErr() {
      if (!onb.error) return;
      onb.error = '';
      errorEl.classList.remove('on');
      errorEl.textContent = '';
    }
    function showErr(msg) {
      onb.error = msg;
      errorEl.textContent = msg;
      errorEl.classList.add('on');
      const btn = foot.querySelector('.btn.primary');
      if (btn) {
        btn.classList.remove('shake');
        void btn.offsetWidth;
        btn.classList.add('shake');
      }
      haptic(16);
    }
    function advance() {
      const err = onbValidate(onb.step);
      if (err) { showErr(err); return; }
      clearErr();
      if (onb.step === ONB_STEPS - 1) return finish();
      onb.step++;
      renderOnb();
    }
    function finish() {
      const blocked = onbBlocked();
      if (blocked) { showErr(blocked); renderOnb(); return; }
      S.profile = {
        name: onb.name.trim().slice(0, NAME_MAX),
        gender: onb.gender,
        birth: onb.birth,
        height: onb.height,
        skin: onb.skin.slice(),
        concerns: onb.concerns.slice()
      };
      S.onboarded = true;
      S.consent = { type: 'local-analysis', at: Date.now() };
      save();
      onb = null;
      go('scan');
    }

    /* steps --------------------------------------------------------------- */
    if (onb.step === 0) {
      const input = h('input', {
        class: 'input', type: 'text', placeholder: 'Your first name', value: onb.name,
        maxlength: String(NAME_MAX), autocomplete: 'given-name', enterkeyhint: 'next',
        oninput: (e) => { onb.name = e.target.value; clearErr(); },
        onkeydown: (e) => { if (e.key === 'Enter') advance(); }
      });
      body.append(
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, T('Welcome')),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'Let\u2019s get your ', h('em', {}, 'baseline'), '.'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Seven quick questions, then one scan. Everything stays on this device \u2014 there is no account and no server.'),
        h('label', { class: 'field ' + riseCls(3), style: rise(3) },
          h('span', { class: 'lab' }, T('What should we call you?')),
          input,
          h('span', { class: 'hint' }, '2\u2013' + NAME_MAX + ' characters')),
        h('p', { class: 'tiny ' + riseCls(4), style: Object.assign({ marginTop: '18px' }, rise(4)) },
          'Lumorph is appearance guidance, not medical advice. It never diagnoses anything.')
      );
      foot.append(nextBtn(T('Continue'), advance));
      setTimeout(() => { if (document.body.contains(input)) input.focus({ preventScroll: true }); }, first ? 520 : 260);
    }

    if (onb.step === 1) {
      const opts = [
        { id: 'male', t: T('Male'), s: 'Uses the male reference ranges' },
        { id: 'female', t: T('Female'), s: 'Uses the female reference ranges' },
        { id: 'other', t: T('Other'), s: 'Uses a blended range' }
      ];
      const group = h('div', { class: 'choices one mt-20' });
      opts.forEach((o, i) => {
        group.append(h('button', {
          class: 'choice ' + riseCls(3 + i), style: rise(3 + i),
          dataset: { id: o.id }, 'aria-pressed': String(onb.gender === o.id),
          onclick: (e) => {
            onb.gender = o.id;
            group.querySelectorAll('.choice').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === o.id)));
            clearErr();
          }
        }, h('span', { class: 'check' }, h('span', { html: I.check, style: { display: 'grid' } })),
           h('span', { class: 't' }, o.t), h('span', { class: 's' }, o.s)));
      });
      body.append(
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, T('About you')),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'How should we ', h('em', {}, 'read'), ' your features?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Scores are measured against reference ranges, so this changes the yardstick \u2014 not the measurement.'),
        group
      );
      foot.append(nextBtn(T('Continue'), advance));
    }

    if (onb.step === 2) {
      const min = new Date();
      min.setFullYear(min.getFullYear() - 110);
      const pill = h('p', { class: 'pill gold ' + (onb.birth ? '' : 'hide'), style: { marginTop: '14px' } },
        onb.birth ? 'Age ' + ageFrom(onb.birth) : '');
      const dateInput = h('input', {
        class: 'input', type: 'date', value: onb.birth,
        max: todayKey(), min: min.toISOString().slice(0, 10),
        onchange: (e) => {
          onb.birth = e.target.value;
          const age = ageFrom(onb.birth);
          pill.textContent = onb.birth ? 'Age ' + age : '';
          pill.classList.toggle('hide', !onb.birth);
          clearErr();
        }
      });
      body.append(
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, T('About you')),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'When were you ', h('em', {}, 'born'), '?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Age shifts what is normal for skin and structure. It is used for your plan, nothing else.'),
        h('label', { class: 'field ' + riseCls(3), style: rise(3) },
          h('span', { class: 'lab' }, T('Date of birth')),
          dateInput,
          h('span', { class: 'hint' }, 'You must be ' + MIN_AGE + ' or older to use Lumorph')),
        pill
      );
      foot.append(nextBtn(T('Continue'), advance));
    }

    if (onb.step === 3) {
      const shown = () => onb.unit === 'cm' ? Math.round(onb.height) : Math.round(onb.height / 2.54);
      const valueEl = h('div', { class: 'display xl mono' }, String(shown()),
        h('span', { class: 'small', style: { marginLeft: '8px' } }, onb.unit === 'cm' ? 'cm' : 'in'));
      const slider = h('input', {
        type: 'range', class: 'ruler',
        min: onb.unit === 'cm' ? 120 : 48, max: onb.unit === 'cm' ? 230 : 91, value: shown(),
        oninput: (e) => {
          const v = Number(e.target.value);
          onb.height = onb.unit === 'cm' ? v : Math.round(v * 2.54);
          valueEl.firstChild.textContent = String(v);
          clearErr();
        }
      });
      const unitToggle = h('div', { class: 'segmented no-thumb mt-20 ' + riseCls(3), style: Object.assign({ maxWidth: '230px' }, rise(3)) });
      [['cm', 'Centimetres'], ['ft', 'Inches']].forEach(([u, label]) => {
        unitToggle.append(h('button', {
          'aria-selected': String(onb.unit === u),
          onclick: () => { onb.unit = u; renderOnb(); }
        }, label));
      });
      body.append(
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, T('About you')),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'How tall are ', h('em', {}, 'you'), '?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Framing advice depends on it. That is all it is used for.'),
        unitToggle,
        h('div', { class: 'center ' + riseCls(4), style: Object.assign({ marginTop: '30px' }, rise(4)) }, valueEl, slider)
      );
      foot.append(nextBtn(T('Continue'), advance));
    }

    if (onb.step === 4) {
      const group = h('div', { class: 'choices mt-20' });
      SKIN_TYPES.forEach((o, i) => {
        group.append(h('button', {
          class: 'choice ' + riseCls(3 + i * 0.4), style: rise(3 + i * 0.4),
          dataset: { id: o.id }, 'aria-pressed': String(onb.skin.includes(o.id)),
          onclick: (e) => {
            const btn = e.currentTarget;
            const has = onb.skin.includes(o.id);
            onb.skin = has ? onb.skin.filter((x) => x !== o.id) : onb.skin.concat(o.id);
            btn.setAttribute('aria-pressed', String(!has));
            clearErr();
          }
        }, h('span', { class: 'check' }, h('span', { html: I.check, style: { display: 'grid' } })),
           h('span', { class: 't' }, o.t), h('span', { class: 's' }, o.s)));
      });
      body.append(
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, T('Your skin')),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'Which skin type ', h('em', {}, 'fits'), ' best?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Pick everything that applies. Your routine is built around this.'),
        group
      );
      foot.append(nextBtn(T('Continue'), advance));
    }

    if (onb.step === 5) {
      const group = h('div', { class: 'choices mt-20' });
      CONCERNS.forEach((o, i) => {
        group.append(h('button', {
          class: 'choice ' + riseCls(3 + i * 0.4), style: rise(3 + i * 0.4),
          dataset: { id: o.id }, 'aria-pressed': String(onb.concerns.includes(o.id)),
          onclick: (e) => {
            const btn = e.currentTarget;
            const has = onb.concerns.includes(o.id);
            if (!has && onb.concerns.length >= 3) { toast('Three targets is plenty'); return; }
            onb.concerns = has ? onb.concerns.filter((x) => x !== o.id) : onb.concerns.concat(o.id);
            btn.setAttribute('aria-pressed', String(!has));
            clearErr();
          }
        }, h('span', { class: 'check' }, h('span', { html: I.check, style: { display: 'grid' } })),
           h('span', { class: 't' }, o.t), h('span', { class: 's' }, o.s)));
      });
      body.append(
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, T('Your skin')),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'What do you want to ', h('em', {}, 'change'), '?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Your plan targets these. Pick up to three.'),
        group
      );
      foot.append(nextBtn(T('Continue'), advance));
    }

    if (onb.step === 6) {
      const tips = [
        ['Face the light', 'Stand facing a window or a soft lamp, with nothing bright behind you.'],
        ['Glasses off, hair back', 'Your forehead, brows and jawline all need to be visible.'],
        ['Relax your face', 'Mouth closed, no smile, eyes on the camera.'],
        ['Phone at eye level', 'Hold it straight in front of you, at arm\u2019s length.']
      ];
      body.append(
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, T('Your first scan')),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'How to take a ', h('em', {}, 'good'), ' scan'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'This scan is the baseline every later scan is compared with.'),
        h('div', { class: 'card mt-20 ' + riseCls(3), style: rise(3) },
          tips.map((t, i) => h('div', { class: 'row gap-12', style: { padding: '11px 0', borderTop: i ? '1px solid var(--line)' : 'none' } },
            h('div', { class: 'pill gold num-badge' }, String(i + 1)),
            h('div', {}, h('div', { style: { fontSize: '13.5px', fontWeight: '600' } }, t[0]),
              h('div', { class: 'small' }, t[1]))))),
        h('div', { class: 'card mt-16 ' + riseCls(4), style: rise(4) },
          h('div', { class: 'row gap-10', style: { marginBottom: '8px' } },
            h('span', { html: I.shield, style: { width: '18px', height: '18px', color: 'var(--gold)', display: 'grid' } }),
            h('span', { style: { fontSize: '13.5px', fontWeight: '600' } }, 'Where your photo goes')),
          h('p', { class: 'small' }, 'Nowhere. The scan runs in this browser tab, the measurements never leave the device, and the photo is kept in this browser\u2019s own storage so you can see your history. No upload, no account, no third party.'))
      );
      foot.append(nextBtn(T('Take my first scan'), advance, I.camera));
    }

    view.append(wrap);
    if (first) reveal(view);
    onb.seenAnim = true;
  }

  function nextBtn(label, onTap, icon) {
    return h('button', { class: 'btn primary', onclick: onTap },
      icon ? h('span', { html: icon, style: { width: '18px', height: '18px', display: 'grid' } }) : null,
      label);
  }

  function ageFrom(birth) {
    if (!birth) return '';
    const b = new Date(birth), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    const m = n.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--;
    return a;
  }

  /* ---------- home ---------- */
  ROUTES.home = function (root) {
    if (!S.onboarded) return go('onboarding');
    const scan = lastScan();
    const rk = rankOf(S.xp);
    const q = dayQuests();
    const done = QUESTS.filter((x) => q[x.id]).length;
    const hour = new Date().getHours();
    const greet = hour < 5 ? T('Still up') : hour < 12 ? T('Good morning') : hour < 17 ? T('Good afternoon') : hour < 22 ? T('Good evening') : T('Still up');
    const focus = scan && scan.pillars
      ? E.PILLARS.filter((p) => scan.pillars[p.id] != null).sort((a, b) => scan.pillars[a.id] - scan.pillars[b.id])[0]
      : null;

    const days = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const k = todayKey(d);
      const qq = S.quests[k] || {};
      days.push({
        d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        n: d.getDate(),
        done: QUESTS.some((x) => qq[x.id]),
        today: i === 0
      });
    }

    root.append(
      h('div', { class: 'rise', style: { '--i': 0, paddingTop: '6px' } },
        h('div', { class: 'row between' },
          h('div', {},
            h('p', { class: 'eyebrow' }, T('Welcome back')),
            h('h1', { class: 'display lg', style: { marginTop: '6px' } }, greet + ', ', h('em', {}, txt(S.profile.name, 'you')))),
          h('div', { class: 'pill gold' }, h('span', { class: 'dot' }), rk.name))),

      h('div', { class: 'week mt-20 rise', style: { '--i': 1 } }, days.map((d) =>
        h('div', { class: 'day' + (d.done ? ' done' : '') + (d.today ? ' today' : '') },
          h('span', { class: 'd' }, d.d), h('span', { class: 'n' }, String(d.n)), h('span', { class: 'mark' })))),

      h('p', { class: 'small mt-12 rise day-line', style: { '--i': 2 } },
        done === 0 ? 'Nothing yet today \u2014 clear a quest or take a scan.' : done + ' of 6 cleared today. Keep going.'),

      /* focus card */
      h('div', { class: 'card gold mt-20 rise', style: { '--i': 3 } },
        scan ? [
          h('div', { class: 'row gap-16' },
            ring(78, scan.overall, 0),
            h('div', { class: 'grow' },
              h('div', { class: 'row between' },
                h('p', { class: 'eyebrow' }, T('Focus')),
                h('span', { class: 'tier-chip' }, E.tierFor(scan.overall, (S.profile && S.profile.gender) || 'other').short)),
              h('div', { class: 'display sm', style: { marginTop: '4px' } }, focus ? focus.label : T('Balanced')),
              h('div', { class: 'row gap-12 mt-8' },
                stat(T('Face'), scan.overall),
                stat(T('Skin'), scan.pillars.skin != null ? scan.pillars.skin : '\u2014')))),
          h('div', { class: 'row gap-8 mt-16' },
            h('button', { class: 'btn small ghost', onclick: () => go('results') }, T('See breakdown')),
            h('button', { class: 'btn small ghost', onclick: () => go('scan') }, T('Scan again')))
        ] : [
          h('p', { class: 'eyebrow' }, T('Your baseline')),
          h('div', { class: 'display sm', style: { marginTop: '6px' } }, T('No scan yet')),
          h('p', { class: 'small mt-8' }, 'One photo, measured on this device, gives you every number in the app.'),
          h('button', { class: 'btn primary mt-16', onclick: () => go('scan') }, 'Take your first scan')
        ]),

      /* routine */
      h('div', { class: 'card mt-16 rise', style: { '--i': 4 } },
        h('div', { class: 'card-h' },
          h('div', { class: 'row gap-10' },
            h('span', { class: 'ico', style: { width: '34px', height: '34px', borderRadius: '11px', display: 'grid', placeItems: 'center', background: 'var(--surface-2)', color: 'var(--gold)' } },
              h('span', { html: I.drop, style: { width: '18px', height: '18px', display: 'grid' } })),
            h('div', {},
              h('div', { style: { fontSize: '14px', fontWeight: '600' } }, T('Skin routine')),
              h('div', { class: 'small' }, routineTitle()))),
          h('button', { class: 'icon-btn ghost', 'aria-label': T('Open routine'), onclick: () => go('routine') },
            h('span', { html: I.chev, style: { display: 'grid' } })))),

      /* plan */
      h('div', { class: 'card mt-16 rise', style: { '--i': 5 } },
        h('div', { class: 'row between' },
          h('div', {},
            h('div', { style: { fontSize: '14px', fontWeight: '600' } }, T('Your plan')),
            h('div', { class: 'small' }, planLine())),
          h('div', { class: 'pill' }, done + '/6') )),

      /* quests */
      h('div', { class: 'card mt-16 rise', style: { '--i': 6 } },
        h('div', { class: 'card-h' },
          h('div', { class: 'eyebrow' }, 'Today \u00b7 daily quests'),
          h('div', { class: 'small quest-count' }, done + '/6')),
        h('div', {}, QUESTS.map((q2) => questRow(q2, q))),
        h('div', { class: 'row between mt-16', style: { paddingTop: '14px', borderTop: '1px solid var(--line)' } },
          h('div', {},
            h('div', { class: 'small xp-next' }, rk.next ? rk.next.at - S.xp + ' XP to ' + rk.next.name : T('Top rank reached')),
            h('div', { class: 'bar thin mt-8 xp-bar', style: { width: '150px', '--w': rk.pct } }, h('i', {}))),
          h('div', { class: 'display sm mono' }, h('span', { class: 'xp-total' }, String(S.xp)), ' XP')),

      h('p', { class: 'tiny center mt-20 rise', style: { '--i': 7 } },
        'Appearance guidance only. Not medical advice, and never a diagnosis.'))
    );
  };

  function stat(label, val) {
    return h('div', {},
      h('div', { class: 'tiny', style: { letterSpacing: '0.12em', textTransform: 'uppercase' } }, label),
      h('div', { class: 'display sm mono' }, typeof val === 'number' ? val.toFixed(1) : String(val)));
  }

  function routineTitle() {
    const t = S.profile.skin.map((id) => (SKIN_TYPES.find((s) => s.id === id) || {}).t).filter(Boolean);
    return (t[0] || T('Balanced')) + ' \u00b7 ' + routineSteps().length + ' steps';
  }
  function planLine() {
    const c = S.profile.concerns.map((id) => (CONCERNS.find((s) => s.id === id) || {}).t).filter(Boolean);
    return (c[0] || T('General maintenance')) + ' \u00b7 ' + c.length + ' target' + (c.length === 1 ? '' : 's');
  }

  function questRow(q2, q) {
    const on = !!q[q2.id];
    return h('div', { class: 'quest' + (on ? ' done' : ''), onclick: (e) => toggleQuest(q2, e.currentTarget) },
      h('span', { class: 'tick' }, h('span', { html: I.check, style: { display: 'grid' } })),
      h('div', { class: 'grow' },
        h('div', { class: 't' }, q2.label),
        h('div', { class: 'tiny' }, on ? T('Cleared') : T('Tap to clear'))),
      h('span', { class: 'xp' }, '+' + q2.xp));
  }

  function toggleQuest(q2, rowEl) {
    const q = dayQuests();
    const before = S.xp;
    const on = !q[q2.id];
    q[q2.id] = on;
    S.xp = Math.max(0, S.xp + (on ? q2.xp : -q2.xp));
    const done = QUESTS.filter((x) => q[x.id]).length;
    if (done >= 4 && !q._bonus) { q._bonus = true; S.xp += 25; toast('Four cleared \u2014 +25 bonus XP'); }
    else if (done < 4 && q._bonus) { q._bonus = false; S.xp -= 25; }
    else if (on) toast('+' + q2.xp + ' XP');
    save();
    haptic(on ? 10 : 6);

    /* update the screen in place: no re-render, no scroll jump, no replayed animation */
    if (rowEl) {
      rowEl.classList.toggle('done', on);
      const sub = rowEl.querySelector('.tiny');
      if (sub) sub.textContent = on ? T('Cleared') : T('Tap to clear');
    }
    const count = view.querySelector('.quest-count');
    if (count) count.textContent = done + '/6';
    const line = view.querySelector('.day-line');
    if (line) line.textContent = done === 0
      ? 'Nothing yet today \u2014 clear a quest or take a scan.'
      : done + ' of 6 cleared today. Keep going.';
    const xpEl = view.querySelector('.xp-total');
    if (xpEl) animateNumber(xpEl, S.xp, { from: before, dp: 0, dur: 620 });
    const rk = rankOf(S.xp);
    const bar = view.querySelector('.xp-bar');
    if (bar) bar.style.setProperty('--w', rk.pct);
    const nextLbl = view.querySelector('.xp-next');
    if (nextLbl) nextLbl.textContent = rk.next ? (rk.next.at - S.xp) + ' XP to ' + rk.next.name : T('Top rank reached');
  }

  /* ---------- progress ---------- */
  ROUTES.progress = function (root) {
    const scan = lastScan();
    const rk = rankOf(S.xp);
    const scans = S.scans;

    if (!scans.length) {
      root.append(
        h('div', { class: 'card mt-16 rise' },
          h('p', { class: 'eyebrow' }, 'Nothing to plot yet'),
          h('div', { class: 'display sm mt-8' }, T('Your first scan starts the line')),
          h('p', { class: 'small mt-8' }, 'Progress needs two points. Take a scan now, then again in a week \u2014 same light, same angle.'),
          h('button', { class: 'btn primary mt-16', onclick: () => go('scan') }, T('Take a scan')))
      );
      return;
    }

    const first = scans[0], last = scans[scans.length - 1];
    const delta = last.overall - first.overall;
    const pts = scans.slice(-14).map((s) => s.overall);

    root.append(
      h('div', { class: 'card mt-12 rise', style: { '--i': 0 } },
        h('div', { class: 'row between' },
          h('div', {},
            h('p', { class: 'eyebrow' }, T('Face score')),
            h('div', { class: 'display xl mono', style: { marginTop: '2px' } }, last.overall.toFixed(1))),
          ring(72, last.overall, 0)),
        h('div', { class: 'row gap-8 mt-8' },
          h('span', { class: 'pill ' + (delta >= 0 ? 'gold' : '') },
            (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' since first scan'),
          h('span', { class: 'pill plain' }, scans.length + ' scan' + (scans.length === 1 ? '' : 's'))),
        sparkline(pts),
        h('div', { class: 'row gap-6', style: { flexWrap: 'wrap', marginTop: '6px' } },
          E.PILLARS.filter((p) => p.id !== 'skin' && last.pillars[p.id] != null).map((p) => {
            const d = first.pillars[p.id] != null ? last.pillars[p.id] - first.pillars[p.id] : 0;
            return h('span', { class: 'pill plain' }, p.label + ' ' + (d >= 0 ? '+' : '') + d.toFixed(1));
          })),
        h('p', { class: 'tiny mt-12' }, 'Scores move with light, angle and expression as well as with you. Compare scans taken the same way.')
      ),

      h('button', { class: 'card mt-16 rise', style: { '--i': 1, width: '100%', textAlign: 'left' }, onclick: openRecap },
        h('div', { class: 'row between' },
          h('div', {},
            h('p', { class: 'eyebrow' }, 'Last seven days'),
            h('div', { class: 'display sm', style: { marginTop: '4px' } }, 'Your week')),
          h('span', { class: 'chev', html: I.chev, style: { display: 'grid' } }))),

      h('div', { class: 'card mt-16 rise', style: { '--i': 2 } },
        h('div', { class: 'row between' },
          h('div', {},
            h('p', { class: 'eyebrow' }, T('Rank')),
            h('div', { class: 'display md', style: { marginTop: '4px' } }, rk.name)),
          h('div', { class: 'display sm mono', style: { color: 'var(--gold)' } }, S.xp + ' XP')),
        h('div', { class: 'bar mt-12', style: { '--w': rk.pct } }, h('i', {})),
        h('p', { class: 'tiny mt-8' }, rk.next ? (rk.next.at - S.xp) + ' XP to ' + rk.next.name : T('Top rank reached'))),

      h('div', { class: 'row gap-10 mt-16 rise', style: { '--i': 2 } },
        bigStat(streak(), T('Day streak')),
        bigStat(bestStreak(), T('Best streak')),
        bigStat(monthCount(), T('This month'))),

      h('div', { class: 'card mt-16 rise', style: { '--i': 3 } },
        h('div', { class: 'card-h' },
          h('div', { class: 'eyebrow' }, T('Last five weeks')),
          h('div', { class: 'row gap-8' },
            h('span', { class: 'tiny' }, T('Cleared')),
            h('span', { class: 'tiny', style: { color: 'var(--faint)' } }, 'Frozen'))),
        heatmap()),

      h('div', { class: 'card mt-16 rise', style: { '--i': 4 } },
        h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, T('Scan history')),
        h('div', { class: 'list' }, scans.slice().reverse().map((s) => h('div', {
          class: 'item', onclick: () => { S._open = s.id; go('results', { id: s.id }); }
        },
          h('span', { class: 'ico', style: { background: 'var(--surface-2)' } }, s.overall.toFixed(1)),
          h('div', { class: 'txt' },
            h('div', { class: 't' }, new Date(s.ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })),
            h('div', { class: 's' }, (s.focus && s.focus[0] ? 'Focus: ' + s.focus[0].label : T('Balanced')) + ' \u00b7 ' + new Date(s.ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))),
          h('span', { class: 'chev', html: I.chev, style: { display: 'grid' } }))))),

      h('button', { class: 'item rise', style: { '--i': 5, width: '100%' }, onclick: () => go('how') },
        h('span', { class: 'ico', html: I.info, style: { display: 'grid' } }),
        h('div', { class: 'txt' }, h('div', { class: 't' }, T('How these numbers are calculated')), h('div', { class: 's' }, 'The full rubric, in plain language')),
        h('span', { class: 'chev', html: I.chev, style: { display: 'grid' } }))
    );
  };

  function monthCount() {
    const m = new Date().getMonth();
    return Object.keys(S.quests).filter((k) => {
      const d = new Date(k);
      return d.getMonth() === m && QUESTS.some((x) => S.quests[k][x.id]);
    }).length;
  }
  function bigStat(v, label) {
    return h('div', { class: 'card tight grow' },
      h('div', { class: 'display md mono' }, String(v)),
      h('div', { class: 'tiny', style: { marginTop: '2px' } }, label));
  }
  function heatmap() {
    const cells = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 34);
    for (let i = 0; i < 35; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = todayKey(d);
      const q = S.quests[k] || {};
      const done = QUESTS.filter((x) => q[x.id]).length;
      let cls = '';
      if (d > today) cls = '';
      else if (done === 0) cls = 'frozen';
      else cls = 'l' + Math.min(4, Math.ceil(done / 2));
      cells.push(h('i', { class: cls, style: { '--i': i }, title: k }));
    }
    const el = h('div', { class: 'heat' }, cells);
    raf(() => raf(() => el.classList.add('in')));
    return el;
  }
  function sparkline(vals) {
    const w = 300, hgt = 96, pad = 8;
    const min = Math.min(...vals) - 0.6, max = Math.max(...vals) + 0.6;
    const x = (i) => pad + (i / Math.max(1, vals.length - 1)) * (w - pad * 2);
    const y = (v) => pad + (1 - (v - min) / (max - min || 1)) * (hgt - pad * 2);
    const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
    const area = d + ` L${x(vals.length - 1).toFixed(1)} ${hgt} L${x(0).toFixed(1)} ${hgt} Z`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'spark');
    svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`);
    svg.innerHTML = `<path class="area" d="${area}"/><path class="line" d="${d}"/>` +
      vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === vals.length - 1 ? 4 : 2.4}"/>`).join('');
    const path = svg.querySelector('.line');
    let len = 600;
    try { len = path.getTotalLength() || 600; } catch (e) { /* detached svg */ }
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    raf(() => raf(() => {
      path.style.transition = 'stroke-dashoffset 1200ms cubic-bezier(.22,1,.36,1)';
      path.style.strokeDashoffset = 0;
      svg.classList.add('in');
    }));
    return h('div', { style: { marginTop: '14px' } }, svg);
  }

  /* ---------- ring ---------- */
  function ring(size, score, delay) {
    const r = size / 2 - 6;
    const c = 2 * Math.PI * r;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.innerHTML =
      `<circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="5"/>` +
      `<circle class="prog" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="5" r="${r}"/>`;
    const prog = svg.querySelector('.prog');
    prog.style.strokeDasharray = c;
    prog.style.strokeDashoffset = c;
    setTimeout(() => animateRing(prog, Math.max(0, Math.min(1, score / 10))), delay || 60);
    const val = h('div', { class: 'val', style: { fontSize: Math.round(size * 0.32) + 'px' } }, '0.0');
    setTimeout(() => animateNumber(val, score, { dp: 1, dur: 1000 }), delay || 60);
    return h('div', { class: 'ring', style: { width: size + 'px', height: size + 'px' } }, svg,
      h('div', { class: 'mid' }, val, size > 90 ? h('div', { class: 'cap' }, 'out of 10') : null));
  }

  /* ---------- scan ---------- */
  let cam = { stream: null, raf: null, active: false, lm: null, last: 0, lmReady: null, err: null };
  let flow = { step: 0, shots: [], demo: false };

  function stopCam() {
    cam.active = false;
    if (cam.raf) cancelAnimationFrame(cam.raf);
    cam.raf = null;
    if (cam.stream) { cam.stream.getTracks().forEach((t) => t.stop()); cam.stream = null; }
  }

  async function ensureLandmarker() {
    if (cam.lmReady) return cam.lmReady;
    cam.lmReady = (async () => {
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14');
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
      try {
        const tess = vision.FaceLandmarker.FACE_LANDMARKS_TESSELATION;
        if (tess && tess.length) cam.meshLines = tess.map((c) => [c.start, c.end]);
      } catch (e) { cam.meshLines = null; }
      return vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numFaces: 1
      });
    })();
    return cam.lmReady;
  }

  const GUIDE_FRONT = `<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet">
      <ellipse class="guide-main" cx="100" cy="140" rx="62" ry="94"/>
      <path class="guide-tick" d="M100 34v-12M100 246v12M38 140H26M174 140h-12"/>
      <path class="guide-soft" d="M40 108q60-14 120 0"/>
    </svg>`;

  const GUIDE_SIDE = `<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet">
      <ellipse class="guide-main" cx="100" cy="140" rx="58" ry="92"/>
      <path class="guide-soft" d="M56 96q44-16 88 0"/>
      <path class="guide-tick" d="M100 34v-12M100 246v12"/>
      <path class="guide-arrow" d="M70 150c0 26 22 46 50 44"/>
      <path class="guide-arrow" d="M112 186l9 8-9 9"/>
    </svg>`;

  function guideMarkup(step) {
    return step === 0 ? GUIDE_FRONT : GUIDE_SIDE;
  }

  ROUTES.scan = function (root) {
    const demo = /demo=1/.test(location.search);
    flow = { step: 0, shots: [], demo };

    const video = h('video', { playsinline: true, autoplay: true, muted: true });
    const guide = h('div', { class: 'cam-guide', html: guideMarkup(0) });
    const stepPill = h('div', { class: 'cam-step' }, h('span', { class: 'dot' }), '1 of 2 · ' + T('Front'));
    const hint = h('div', { class: 'cam-hint' }, 'Starting camera\u2026');
    const flash = h('div', { class: 'cam-flash' });
    const meshCanvas = h('canvas', { class: 'cam-mesh' });
    const meshBtn = h('button', { class: 'cam-toggle', 'aria-pressed': 'true' }, 'Mesh');
    const panel = h('div', { class: 'cam-panel' }, video, meshCanvas, guide, stepPill, hint, flash, meshBtn);
    const chips = h('div', { class: 'cam-chips' });
    const fileInput = h('input', { type: 'file', accept: 'image/*', class: 'hide' });

    const shutter = h('button', { class: 'shutter', disabled: true, 'aria-label': T('Capture') },
      h('span', { class: 'shutter-ring' }), h('span', { class: 'shutter-dot' }));

    const skipSide = h('button', {
      class: 'btn small ghost hide', style: { margin: '0 auto' },
      onclick: () => finishFlow()
    }, 'Skip the side photo');

    root.append(
      h('div', { class: 'rise', style: { '--i': 0 } },
        h('div', { class: 'row between', style: { paddingTop: '6px', marginBottom: '12px' } },
          h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: () => go(lastScan() ? 'home' : 'onboarding') },
            h('span', { html: I.close, style: { display: 'grid', width: '18px', height: '18px' } })),
          h('button', { class: 'btn small ghost', onclick: () => fileInput.click() },
            h('span', { html: I.upload, style: { width: '16px', height: '16px', display: 'grid' } }), T('Upload')))),
      h('div', { class: 'rise', style: { '--i': 1, marginBottom: '14px' } },
        h('p', { class: 'eyebrow' }, T('New scan')),
        h('h1', { class: 'display md', style: { marginTop: '4px' } }, T('Fill the oval, look straight.'))),
      h('div', { class: 'rise', style: { '--i': 2 } }, panel),
      chips,
      h('div', { class: 'shutter-row rise', style: { '--i': 3 } }, shutter),
      skipSide,
      fileInput,
      h('p', { class: 'tiny center mt-16 rise', style: { '--i': 4 } },
        aiSettings().consent
          ? 'Measured in this tab. AI read is on, so each scan sends one photo to Google.'
          : 'Measured in this tab. Nothing is uploaded. Photos stay in your browser.')
    );

    const chipEls = {};
    [['face', 'Face'], ['angle', 'Angle'], ['light', 'Light'], ['focus', 'Focus']].forEach(([id, label]) => {
      const el = h('span', { class: 'qchip' }, h('span', { class: 'd' }), label);
      chipEls[id] = el;
      chips.append(el);
    });

    let meshOn = true;
    meshBtn.addEventListener('click', () => {
      meshOn = !meshOn;
      meshBtn.setAttribute('aria-pressed', String(meshOn));
      meshCanvas.style.opacity = meshOn ? '1' : '0';
      if (!meshOn) meshCanvas.getContext('2d').clearRect(0, 0, meshCanvas.width, meshCanvas.height);
    });

    function paintMesh() {
      if (!meshOn || !cam.lm) return;
      const rect = panel.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
      if (meshCanvas.width !== W || meshCanvas.height !== H) {
        meshCanvas.width = W; meshCanvas.height = H;
      }
      const ctx = meshCanvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const vw = video.videoWidth || W, vh = video.videoHeight || H;
      drawMesh(ctx, cam.lm, W, H, {
        map: coverMap(vw, vh, W, H),
        lines: cam.meshLines || E.MESH_LINES,
        stroke: 'rgba(234,213,162,0.45)',
        dot: 'rgba(255,246,223,0.75)',
        dotSize: 1.1 * dpr,
        lineWidth: 0.9 * dpr
      });
    }

    function updateLive() {
      const vw = video.videoWidth || 1080, vh = video.videoHeight || 1440;
      paintMesh();
      const q = E.quality(cam.lm, vw, vh, video, flow.step === 1 ? 'side' : 'front');
      Object.keys(chipEls).forEach((id) => {
        const c = (q.chips || []).find((x) => x.id === id);
        chipEls[id].classList.toggle('ok', !!(c && c.ok));
      });
      guide.classList.toggle('ok', q.ok);
      hint.textContent = q.message;
      shutter.disabled = !q.ok;
    }

    function setStep(n) {
      flow.step = n;
      guide.innerHTML = guideMarkup(n);
      stepPill.innerHTML = '';
      stepPill.append(h('span', { class: 'dot' }), (n === 0 ? '1 of 2 \u00b7 ' + T('Front') : '2 of 2 \u00b7 ' + T('Side')));
      skipSide.classList.toggle('hide', n === 0);
      if (n === 1) {
        hint.textContent = 'Turn about halfway \u2014 not all the way to a profile.';
        shutter.disabled = !flow.demo;
      }
    }

    async function boot() {
      if (demo) {
        hint.textContent = 'Preview mode \u2014 using a sample face';
        shutter.disabled = false;
        cam.lm = E.demoMesh(7);
        paintMesh();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1440 } }, audio: false
        });
        cam.stream = stream;
        cam.active = true;
        video.srcObject = stream;
        await video.play();
        hint.textContent = 'Line your face up with the oval';
        const lm = await ensureLandmarker();
        const tick = () => {
          if (!cam.active) return;
          const now = performance.now();
          if (now - cam.last > 90 && video.readyState >= 2) {
            cam.last = now;
            try {
              const res = lm.detectForVideo(video, now);
              cam.lm = res.faceLandmarks && res.faceLandmarks[0] ? res.faceLandmarks[0] : null;
              updateLive();
            } catch (e) { /* skip a frame */ }
          }
          cam.raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        cam.err = err;
        hint.textContent = err && err.name === 'NotAllowedError'
          ? 'Camera permission denied \u2014 use Upload instead'
          : 'No camera here \u2014 use Upload instead';
        shutter.disabled = true;
      }
    }

    function demoPhoto() {
      const W = 600, H = 800;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, '#1A161C');
      bg.addColorStop(0.55, '#2A2028');
      bg.addColorStop(1, '#120F14');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(W * 0.5, H * 0.34, 10, W * 0.5, H * 0.34, W * 0.62);
      glow.addColorStop(0, 'rgba(234,213,162,0.16)');
      glow.addColorStop(1, 'rgba(234,213,162,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = 'rgba(246,241,231,0.10)';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.86, W * 0.42, H * 0.30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(246,241,231,0.13)';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.40, W * 0.20, H * 0.235, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(246,241,231,0.35)';
      ctx.font = '500 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PREVIEW', W / 2, H - 28);
      return cv;
    }

    function capture() {
      if (flow.demo) {
        takeShot(demoPhoto(), E.demoLandmarks(Math.floor(Math.random() * 9999) + 3), 600, 800);
        return;
      }
      if (!cam.lm || !cam.stream) { toast('No face detected yet'); return; }
      const vw = video.videoWidth, vh = video.videoHeight;
      const flipped = (S.settings.mirror === 'flipped');
      const cv = document.createElement('canvas');
      cv.width = vw; cv.height = vh;
      const ctx = cv.getContext('2d');
      if (flipped) { ctx.translate(vw, 0); ctx.scale(-1, 1); }
      ctx.drawImage(video, 0, 0, vw, vh);
      let pts = flipped ? cam.lm.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z })) : cam.lm;

      // re-read the landmarks from this exact frame, so a moving head cannot
      // leave the mesh lagging behind the photo that gets saved
      (async () => {
        try {
          const lmk = await ensureLandmarker();
          await lmk.setOptions({ runningMode: 'IMAGE' });
          const res = lmk.detect(cv);
          await lmk.setOptions({ runningMode: 'VIDEO' });
          if (res.faceLandmarks && res.faceLandmarks[0]) pts = res.faceLandmarks[0];
        } catch (e) { /* keep the live points */ }
        takeShot(cv, pts, vw, vh);
      })();
    }

    function takeShot(source, lm, w, h) {
      haptic(18);
      flash.classList.remove('on');
      void flash.offsetWidth;
      flash.classList.add('on');
      flow.shots.push({ source, lm, w, h });
      if (flow.shots.length === 1) {
        setTimeout(() => setStep(1), 260);
      } else {
        finishFlow();
      }
    }

    function finishFlow() {
      if (!flow.shots.length) return;
      const front = flow.shots[0];
      const side = flow.shots[1] || null;
      processScan(front, side);
    }

    shutter.addEventListener('click', capture);

    fileInput.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const img = new Image();
      img.onload = async () => {
        try {
          const lm = await ensureLandmarker();
          await lm.setOptions({ runningMode: 'IMAGE' });
          const res = lm.detect(img);
          await lm.setOptions({ runningMode: 'VIDEO' });
          const pts = res.faceLandmarks && res.faceLandmarks[0];
          if (!pts) { toast('No face found in that photo'); return; }
          flow.shots = [{ source: img, lm: pts, w: img.naturalWidth, h: img.naturalHeight }];
          finishFlow();
        } catch (err) {
          toast('Could not read that photo');
        }
      };
      img.src = URL.createObjectURL(f);
    });

    if (S.onboarded) boot(); else go('onboarding');
  };

  /* ---------- processing ---------- */
  let pendingScan = null;

  function processScan(front, side) {
    stopCam();
    pendingScan = { front, side };
    go('processing');
  }

  ROUTES.processing = function (root) {
    const p = pendingScan;
    const steps = [T('Measuring your face'), T('Reading your skin'), T('Building your plan')];
    const list = h('div', { class: 'proc-list' });
    const nodes = steps.map((s, i) => {
      const n = h('div', { class: 'proc-step' + (i === 0 ? ' active' : '') },
        h('span', { class: 'b' }, h('span', { html: I.check, style: { display: 'grid' } })),
        h('span', { class: 'lbl' }, s), h('span', { class: 'spin-sm' }));
      list.append(n);
      return n;
    });

    root.append(h('div', { class: 'proc' },
      h('div', { class: 'orb' },
        h('div', { class: 'core' }),
        h('div', { class: 'halo', html: '<svg viewBox="0 0 148 148"><circle cx="74" cy="74" r="66"/></svg>' }),
        h('div', { class: 'halo slow', html: '<svg viewBox="0 0 148 148"><circle cx="74" cy="74" r="52"/></svg>' })),
      h('div', {},
        h('p', { class: 'eyebrow' }, 'Scan captured'),
        h('h1', { class: 'display lg', style: { marginTop: '8px' } }, 'Preparing your ', h('em', {}, 'results'))),
      list));

    if (!p || !p.front) { setTimeout(() => go('home'), 400); return; }

    let i = 0;
    const advance = () => {
      if (route !== 'processing') return;
      nodes[i].classList.remove('active');
      nodes[i].classList.add('done');
      i++;
      if (i < nodes.length) {
        nodes[i].classList.add('active');
        setTimeout(advance, 620);
      } else {
        setTimeout(finish, 380);
      }
    };
    setTimeout(advance, 620);

    function finish() {
      if (route !== 'processing') return;
      const f = p.front;
      let metrics = {};
      let quality = { ok: true, chips: [] };
      try {
        metrics = E.rawMetrics(f.lm, f.w, f.h);
        if (f.source) {
          // exposure is pulled toward a neutral target before skin is read, so a
          // dim room does not score as worse skin than a bright one
          const lit = E.normalise(f.source);
          const skin = E.skinMetrics(lit, f.lm);
          if (skin) Object.assign(metrics, skin);
          quality = E.quality(f.lm, f.w, f.h, f.source);
        }
      } catch (err) { /* keep whatever measured cleanly */ }

      if (!f.source && /demo=1/.test(location.search)) {
        Object.assign(metrics, { evenness: 0.052, redness: 0.061, underEye: 0.031, shine: 0.64, texture: 0.030 });
      }

      const res = E.score(metrics, (S.profile && S.profile.gender) || 'other');

      // side profile, beta, never part of the overall score
      let side = null;
      if (p.side && p.side.lm) {
        try {
          const sm = E.sideMetrics(p.side.lm, p.side.w, p.side.h);
          if (sm) {
            side = {
              score: Math.max(1, Math.min(10, Math.round(sm.harmony * 10) / 10)),
              jawline: Math.round(sm.jawline * 10) / 10,
              projection: Math.round(sm.chinProjection * 10) / 10
            };
          }
        } catch (e) { side = null; }
      }

      const thumb = f.source ? shrink(f.source, 320) : null;
      const scan = {
        id: 's' + Date.now(),
        ts: Date.now(),
        overall: res.overall,
        pillars: res.pillars,
        details: res.details,
        focus: res.focus,
        metrics,
        side,
        lm: E.encodeLandmarks(f.lm),
        demo: !f.source && /demo=1/.test(location.search),
        quality: { ok: quality.ok, chips: (quality.chips || []).map((c) => ({ id: c.id, label: c.label, ok: c.ok })) },
        thumb
      };
      S.scans.push(scan);
      const cap = (S.badges && S.badges.supporter) ? 200 : 60;
      if (S.scans.length > cap) S.scans.shift();
      S._open = scan.id;
      save();
      pendingScan = null;
      go('results', { id: scan.id });
      if (aiSettings().consent && f.source) runAiRead(scan, f.source);
    }
  };

  function shrink(src, width) {
    try {
      const cv = document.createElement('canvas');
      const ratio = src.height / src.width || 1.33;
      cv.width = width;
      cv.height = Math.round(width * ratio);
      cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/jpeg', 0.62);
    } catch (e) { return null; }
  }

  /* ---------- results ---------- */
  let resTab = 'face';
  ROUTES.results = function (root, opts) {
    const id = (opts && opts.id) || S._open || (lastScan() && lastScan().id);
    const scan = S.scans.find((s) => s.id === id) || lastScan();
    if (!scan) return go('scan');

    const seg = h('div', { class: 'segmented rise', style: { '--i': 1 } });
    const thumb = h('div', { class: 'thumb' });
    seg.append(thumb);
    [['face', T('Face')], ['ratings', T('Ratings')], ['insights', T('Insights')]].forEach(([k, label]) => {
      seg.append(h('button', {
        'aria-selected': String(resTab === k),
        onclick: (e) => {
          resTab = k;
          const btns = seg.querySelectorAll('button');
          btns.forEach((b, i) => b.setAttribute('aria-selected', String(['face', 'ratings', 'insights'][i] === k)));
          moveThumb(seg, thumb, ['face', 'ratings', 'insights'].indexOf(k));
          paintBody();
        }
      }, label));
    });

    root.append(
      h('div', { class: 'rise', style: { '--i': 0 } },
        h('div', { class: 'row between', style: { paddingTop: '6px', marginBottom: '10px' } },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => go('home') },
            h('span', { html: I.back, style: { display: 'grid', width: '18px', height: '18px' } })),
          h('div', { class: 'row gap-8' },
            h('button', { class: 'icon-btn', 'aria-label': 'Landmark mesh', onclick: () => openMesh(scan) },
              h('span', { html: I.mesh, style: { display: 'grid', width: '19px', height: '19px' } })),
            h('button', { class: 'icon-btn', 'aria-label': 'Download report', onclick: () => downloadReport(scan) },
              h('span', { html: I.report, style: { display: 'grid', width: '19px', height: '19px' } })),
            h('button', { class: 'icon-btn', 'aria-label': 'Share', onclick: () => shareResult(scan) },
              h('span', { html: I.share, style: { display: 'grid', width: '19px', height: '19px' } })))),
        h('p', { class: 'eyebrow' }, 'Your scan'),
        h('h1', { class: 'display md', style: { marginTop: '4px', marginBottom: '14px' } }, 'Face ', h('em', {}, 'analysis'))),
      seg
    );
    const body = h('div', { class: 'mt-20 res-body' });
    root.append(body);

    function paintBody() {
      body.innerHTML = '';
      if (resTab === 'face') body.append(faceTab(scan));
      if (resTab === 'ratings') body.append(ratingsTab(scan));
      if (resTab === 'insights') body.append(insightsTab(scan));
      reveal(body);
    }
    raf(() => raf(() => moveThumb(seg, thumb, ['face', 'ratings', 'insights'].indexOf(resTab))));
    paintBody();
  };

  function moveThumb(seg, thumb, idx) {
    const btns = seg.querySelectorAll('button');
    const b = btns[idx];
    if (!b) return;
    thumb.style.width = b.offsetWidth + 'px';
    thumb.style.transform = `translate3d(${b.offsetLeft - 4}px,0,0)`;
  }

  function faceTab(scan) {
    const wrap = h('div', {});
    wrap.append(
      h('div', { class: 'card gold rise', style: { '--i': 0 } },
        h('div', { class: 'row gap-16' },
          ring(112, scan.overall, 120),
          h('div', { class: 'grow' },
            h('p', { class: 'eyebrow' }, T('Overall')),
            h('div', { class: 'display md', style: { marginTop: '2px' } }, scoreWord(scan.overall)),
            (() => {
              const tr = E.tierFor(scan.overall, (S.profile && S.profile.gender) || 'other');
              return h('div', { class: 'tier-line' },
                h('span', { class: 'tier-name' }, tr.label),
                h('span', { class: 'tier-code' }, tr.short + ' \u00b7 ' + tr.band));
            })(),
            h('p', { class: 'small mt-8' }, aiSettings().consent
              ? '478 landmarks measured on this device, blended with a model read of the photo.'
              : 'Measured from 478 landmarks on this device. No cloud, no guessing.')))),
      h('div', { class: 'rise', style: { '--i': 1 } }, aiCard(scan)),

      h('div', { class: 'card mt-16 rise', style: { '--i': 2 } },
        h('div', { class: 'card-h' }, h('div', { class: 'eyebrow' }, T('Pillars'))),
        E.PILLARS.map((p) => {
          const v = scan.pillars[p.id];
          return h('div', { class: 'pillar' },
            h('div', { class: 'top' },
              h('span', { class: 'name' }, p.label),
              h('span', { class: 'score' }, v == null ? '\u2014' : v.toFixed(1))),
            h('div', { class: 'bar', style: { '--w': (v || 0) / 10 } }, h('i', {})),
            h('div', { class: 'blurb' }, p.blurb));
        })),
      scan.side ? h('div', { class: 'card mt-16 rise', style: { '--i': 2 } },
        h('div', { class: 'card-h' },
          h('div', { class: 'eyebrow' }, 'Side profile \u00b7 beta'),
          h('span', { class: 'display sm mono', style: { color: 'var(--gold)' } }, num(scan.side.score, 1))),
        h('p', { class: 'small' }, 'Read from your side photo. Approximate by nature, and not counted in your overall score.'),
        h('div', { class: 'row between mt-12' },
          h('span', { class: 'small' }, 'Jaw line'),
          h('span', { class: 'display sm mono' }, num(scan.side.jawline, 1, '\u00b0'))),
        h('div', { class: 'row between mt-8' },
          h('span', { class: 'small' }, 'Chin projection'),
          h('span', { class: 'display sm mono' }, num(scan.side.projection, 1, '\u00b0')))) : null,

      h('div', { class: 'mt-20 rise', style: { '--i': 3 } },
        h('h2', { class: 'display sm', style: { marginBottom: '10px' } }, T('Where to focus')),
        h('div', { class: 'list' }, (scan.focus || []).map((f) => h('div', { class: 'item' },
          h('span', { class: 'ico' }, h('span', { html: I.bolt, style: { width: '16px', height: '16px', display: 'grid' } })),
          h('div', { class: 'txt' },
            h('div', { class: 't' }, f.label),
            h('div', { class: 's' }, f.tip)),
          h('span', { class: 'display sm mono', style: { color: 'var(--gold)' } }, f.score.toFixed(1)))))),
      h('div', { class: 'row gap-10 mt-20 rise', style: { '--i': 3 } },
        h('button', { class: 'btn ghost', onclick: () => go('routine') }, T('Your routine')),
        h('button', { class: 'btn primary', onclick: () => go('scan') }, T('Scan again')))
    );
    return wrap;
  }

  function scoreWord(v) {
    if (v >= 9) return T('Exceptional');
    if (v >= 8) return T('Strong');
    if (v >= 7) return T('Good');
    if (v >= 6) return T('Solid');
    if (v >= 5) return T('Average');
    return T('Room to work');
  }

  function ratingsTab(scan) {
    const byPillar = {};
    (scan.details || []).forEach((d) => { (byPillar[d.pillar] = byPillar[d.pillar] || []).push(d); });
    return h('div', {},
      h('div', { class: 'card rise', style: { '--i': 0 } },
        h('div', { class: 'row gap-16' },
          scan.thumb ? h('img', { src: scan.thumb, alt: 'Your scan', style: { width: '92px', height: '92px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--line-strong)' } })
            : h('div', { style: { width: '92px', height: '92px', borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' } },
                h('span', { html: I.profile, style: { width: '30px', height: '30px', color: 'var(--muted)', display: 'grid' } })),
          h('div', {},
            h('p', { class: 'eyebrow' }, T('Overall')),
            h('div', { class: 'display xl mono' }, scan.overall.toFixed(1)),
            h('p', { class: 'small' }, 'of 10 \u00b7 ' + (scan.details || []).length + ' measurements')))),
      h('div', { class: 'card mt-16 rise', style: { '--i': 1 } },
        h('div', { class: 'eyebrow', style: { marginBottom: '6px' } }, T('Every measurement')),
        E.PILLARS.map((p) => {
          const rows = byPillar[p.id] || [];
          if (!rows.length) return null;
          return h('div', { style: { marginTop: '12px' } },
            h('div', { class: 'row between', style: { marginBottom: '4px' } },
              h('span', { class: 'small', style: { color: 'var(--ink)', fontWeight: '600' } }, p.label),
              h('span', { class: 'tiny mono' }, scan.pillars[p.id] != null ? scan.pillars[p.id].toFixed(1) : '\u2014')),
            rows.map((d) => h('div', { class: 'metric tap', onclick: () => openMetric(scan, d) },
              h('div', { class: 'mt' }, h('div', { class: 'mn' }, d.label), h('div', { class: 'mv' }, d.valueLabel)),
              h('div', { class: 'mb' }, h('div', { class: 'bar thin', style: { '--w': d.score / 10 } }, h('i', {}))),
              h('div', { class: 'ms' }, d.score.toFixed(1)))));
        })),
      h('p', { class: 'tiny mt-16 rise', style: { '--i': 2 } },
        'Each measurement scores 10 inside its ideal range and falls away smoothly outside it. Pillar scores are the average of their measurements.')
    );
  }

  function insightsTab(scan) {
    const skinRows = (scan.details || []).filter((d) => d.pillar === 'skin');
    const routine = routineSteps();
    return h('div', {},
      h('div', { class: 'card rise', style: { '--i': 0 } },
        h('div', { class: 'card-h' },
          h('div', { class: 'eyebrow' }, T('Skin signals')),
          h('span', { class: 'display sm mono', style: { color: 'var(--gold)' } },
            scan.pillars.skin != null ? scan.pillars.skin.toFixed(1) : '\u2014')),
        skinRows.length ? skinRows.map((d) => h('div', { class: 'metric' },
          h('div', { class: 'mt' }, h('div', { class: 'mn' }, d.label), h('div', { class: 'mv' }, d.valueLabel)),
          h('div', { class: 'mb' }, h('div', { class: 'bar thin', style: { '--w': d.score / 10 } }, h('i', {}))),
          h('div', { class: 'ms' }, d.score.toFixed(1))))
          : h('p', { class: 'small' }, 'Skin signals need a captured photo, not an upload.'),
        h('p', { class: 'tiny mt-12' }, 'Read from the pixels of this one photo: tone variance, redness, under-eye contrast, shine and texture. It is an appearance estimate, not a measurement of your skin.')),

      h('div', { class: 'card mt-16 rise', style: { '--i': 1 } },
        h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, T('What to do next')),
        routine.slice(0, 3).map((s) => h('div', { class: 'item' },
          h('span', { class: 'ico' }, h('span', { html: I.check, style: { width: '15px', height: '15px', display: 'grid' } })),
          h('div', { class: 'txt' }, h('div', { class: 't' }, s.title), h('div', { class: 's' }, s.note))))),

      h('div', { class: 'card mt-16 rise', style: { '--i': 2 } },
        h('div', { class: 'row gap-10', style: { marginBottom: '8px' } },
          h('span', { html: I.shield, style: { width: '18px', height: '18px', color: 'var(--gold)', display: 'grid' } }),
          h('span', { style: { fontWeight: '600', fontSize: '13.5px' } }, 'Cosmetic insight only')),
        h('p', { class: 'small' }, 'Lumorph does not diagnose, treat or screen for any condition. If something on your skin worries you, see a dermatologist.')),
      h('div', { class: 'row gap-10 mt-20 rise', style: { '--i': 3 } },
        h('button', { class: 'btn ghost', onclick: () => go('how') }, T('How this is scored')),
        h('button', { class: 'btn primary', onclick: () => go('routine') }, T('Open routine')))
    );
  }

  /* ---------- AI read ---------- */
  function aiSettings() {
    S.settings = S.settings || {};
    if (!S.settings.ai) S.settings.ai = { consent: false };
    return S.settings.ai;
  }

  function toJpegDataUrl(src, width, quality) {
    const w = src.naturalWidth || src.videoWidth || src.width;
    const h = src.naturalHeight || src.videoHeight || src.height;
    if (!w || !h) return null;
    const scale = Math.min(1, width / w);
    const cv = document.createElement('canvas');
    cv.width = Math.round(w * scale);
    cv.height = Math.round(h * scale);
    cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', quality || 0.78);
  }

  async function runAiRead(scan, source) {
    scan.ai = { status: 'pending' };
    save();
    refreshAiCard(scan);
    try {
      const image = source ? toJpegDataUrl(source, 768, 0.8) : (scan.thumb || null);
      if (!image) throw new Error('No photo on this scan');
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image })
      });
      let j = {};
      try { j = await res.json(); } catch (e) { j = {}; }
      if (!res.ok) throw new Error(j.message || j.error || 'The read failed');
      if (!j.face_found) { scan.ai = { status: 'noface' }; save(); refreshAiCard(scan); return; }

      scan.ai = {
        status: 'done',
        score: j.attractiveness,
        harmony: j.harmony,
        skin: j.skin,
        tier: j.tier,
        strengths: j.strengths || [],
        improvements: j.improvements || []
      };
      if (scan.geoOverall == null) scan.geoOverall = scan.overall;
      scan.overall = Math.round((scan.geoOverall * 0.5 + j.attractiveness * 0.5) * 10) / 10;
      save();
      refreshAiCard(scan);
      refreshResults(scan);
    } catch (err) {
      scan.ai = { status: 'error', message: String((err && err.message) || 'The read failed') };
      save();
      refreshAiCard(scan);
    }
  }

  function refreshResults(scan) {
    if (route !== 'results') return;
    const body = view.querySelector('.res-body');
    if (!body) return;
    const y = window.scrollY;
    body.innerHTML = '';
    if (resTab === 'face') body.append(faceTab(scan));
    if (resTab === 'ratings') body.append(ratingsTab(scan));
    if (resTab === 'insights') body.append(insightsTab(scan));
    fillBars(body);
    window.scrollTo(0, y);
  }

  function refreshAiCard(scan) {
    const host = document.getElementById('ai-card');
    if (!host) return;
    const y = window.scrollY;
    host.innerHTML = '';
    host.append(aiCardInner(scan));
    fillBars(host);
    window.scrollTo(0, y);
  }

  function aiCardInner(scan) {
    const ai = scan.ai || null;
    const on = aiSettings().consent;

    if (!ai) {
      return h('div', { class: 'ai-card' },
        h('div', { class: 'row between' },
          h('div', {},
            h('p', { class: 'eyebrow' }, 'Second opinion'),
            h('div', { class: 'display sm', style: { marginTop: '4px' } }, 'AI read')),
          h('span', { class: 'ai-badge' + (on ? ' live' : '') }, on ? 'ready' : 'off')),
        h('p', { class: 'small mt-8' }, 'Geometry measures proportion. It cannot tell a handsome face with bad skin from an unremarkable one with good bones. A vision model can.'),
        on
          ? h('p', { class: 'tiny mt-8' }, 'This sends this one photo to Google Gemini. Nothing else.')
          : h('p', { class: 'tiny mt-8' }, 'Turning this on sends this one photo to Google Gemini. Nothing else, and only when you ask.'),
        h('button', { class: 'btn small primary mt-12', onclick: () => {
          if (!on) { aiSettings().consent = true; save(); }
          runAiRead(scan, null);
        } }, 'Read this photo'));
    }

    if (ai.status === 'pending') {
      return h('div', { class: 'ai-card' },
        h('div', { class: 'row between' },
          h('div', {}, h('p', { class: 'eyebrow' }, 'Second opinion'), h('div', { class: 'display sm', style: { marginTop: '4px' } }, 'Reading\u2026')),
          h('span', { class: 'ai-badge live' }, 'AI')),
        h('div', { class: 'ai-skel mt-12' }, h('i', {}), h('i', {}), h('i', {})));
    }

    if (ai.status === 'noface') {
      return h('div', { class: 'ai-card' },
        h('p', { class: 'eyebrow' }, 'Second opinion'),
        h('p', { class: 'small mt-8' }, 'The model could not find a clear face in this photo. Try a straight-on shot in better light.'));
    }

    if (ai.status === 'error') {
      return h('div', { class: 'ai-card' },
        h('p', { class: 'eyebrow' }, 'Second opinion'),
        h('p', { class: 'small mt-8' }, ai.message || 'The read failed.'),
        h('button', { class: 'btn small ghost mt-12', onclick: () => runAiRead(scan, null) }, 'Try again'));
    }

    const rows = [['Attractiveness', ai.score], ['Harmony', ai.harmony], ['Skin', ai.skin]];
    return h('div', { class: 'ai-card' },
      h('div', { class: 'row between' },
        h('div', {},
          h('p', { class: 'eyebrow' }, 'Second opinion'),
          h('div', { class: 'display sm', style: { marginTop: '4px' } }, ai.tier || 'AI read')),
        h('span', { class: 'ai-badge live' }, 'AI')),
      h('div', { class: 'ai-rows mt-12' },
        rows.map(([k, v]) => h('div', { class: 'ai-row' },
          h('span', { class: 'k' }, k),
          h('span', { class: 'v' }, num(v, 1))))),
      ai.strengths && ai.strengths.length ? h('div', { class: 'mt-12' },
        h('p', { class: 'eyebrow' }, 'Strengths'),
        ai.strengths.map((s) => h('p', { class: 'small mt-4' }, '\u00b7 ' + s))) : null,
      ai.improvements && ai.improvements.length ? h('div', { class: 'mt-12' },
        h('p', { class: 'eyebrow' }, 'Worth working on'),
        ai.improvements.map((s) => h('p', { class: 'small mt-4' }, '\u00b7 ' + s))) : null,
      h('p', { class: 'tiny mt-12' }, 'Model estimate from this one photo, blended 50/50 with the geometric score. Not medical advice.'));
  }

  function aiCard(scan) {
    return h('div', { id: 'ai-card' }, aiCardInner(scan));
  }

  /* ---------- landmark mesh ---------- */
  function coverMap(vw, vh, pw, ph) {
    const scale = Math.max(pw / vw, ph / vh);
    const dw = vw * scale, dh = vh * scale;
    return { dx: (pw - dw) / 2, dy: (ph - dh) / 2, dw, dh };
  }

  function drawMesh(ctx, lm, W, H, opts) {
    const o = opts || {};
    if (!lm) return;
    const lines = o.lines || E.MESH_LINES;
    const mx = (p) => (o.map ? o.map.dx + p.x * o.map.dw : p.x * W);
    const my = (p) => (o.map ? o.map.dy + p.y * o.map.dh : p.y * H);
    ctx.save();
    ctx.strokeStyle = o.stroke || 'rgba(234,213,162,0.55)';
    ctx.lineWidth = o.lineWidth || 1;
    ctx.beginPath();
    for (let k = 0; k < lines.length; k++) {
      const line = lines[k];
      for (let i = 0; i < line.length; i++) {
        const p = lm[line[i]];
        if (!p) continue;
        const x = mx(p), y = my(p);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    if (o.dots !== false) {
      ctx.fillStyle = o.dot || 'rgba(255,246,223,0.92)';
      const r = o.dotSize || 1.4;
      const seen = {};
      for (let k = 0; k < lines.length; k++) {
        for (let i = 0; i < lines[k].length; i++) {
          const id = lines[k][i];
          if (seen[id]) continue;
          seen[id] = 1;
          const p = lm[id];
          if (!p) continue;
          ctx.beginPath();
          ctx.arc(mx(p), my(p), r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (o.indices) {
      ctx.fillStyle = 'rgba(150,200,255,0.95)';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      const idx = E.MESH_LINES[0];
      idx.forEach((i) => {
        const p = lm[i];
        if (!p) return;
        ctx.fillText(String(i), mx(p), my(p) - 6);
      });
    }
    ctx.restore();
  }

  function openMesh(scan) {
    const lm = scan.demo ? E.demoMesh(7) : E.decodeLandmarks(scan.lm);
    if (!lm) { toast('No landmark data on this scan'); return; }

    const cv = h('canvas', { class: 'metric-canvas' });
    let showIdx = false;

    const paint = () => {
      const W = 700;
      const finish = (H, img) => {
        cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#0B0B10';
        ctx.fillRect(0, 0, W, H);
        if (img) {
          ctx.drawImage(img, 0, 0, W, H);
          ctx.fillStyle = 'rgba(7,7,10,0.22)';
          ctx.fillRect(0, 0, W, H);
        }
        drawMesh(ctx, lm, W, H, {
          indices: showIdx, lineWidth: 1.2, dotSize: 1.6,
          stroke: img ? 'rgba(234,213,162,0.55)' : 'rgba(234,213,162,0.7)'
        });
      };
      if (scan.thumb) {
        const img = new Image();
        img.onload = () => {
          const H = Math.round(W * (img.naturalHeight / img.naturalWidth)) || 900;
          finish(H, img);
        };
        img.onerror = () => finish(900, null);
        img.src = scan.thumb;
      } else {
        finish(900, null);
      }
    };
    paint();

    const toggle = h('button', { class: 'btn small ghost', onclick: () => { showIdx = !showIdx; paint(); } }, 'Numbers');

    openSheet(h('div', {},
      h('p', { class: 'eyebrow' }, 'Landmark mesh'),
      h('h2', { class: 'display sm', style: { marginTop: '6px' } }, '478 points'),
      h('p', { class: 'small mt-12' }, 'Every measurement comes from these points. They are found on your device and never stored with the photo.'),
      h('div', { class: 'mt-16' }, cv),
      h('div', { class: 'row gap-10 mt-16' }, toggle, h('button', { class: 'btn small ghost', onclick: closeSheet }, 'Close'))));
  }

  /* ---------- share card ---------- */
  const SERIF = '"Instrument Serif", Georgia, serif';
  const SANS = 'Inter, -apple-system, sans-serif';

  function roundRect(ctx, x, y, w, hh, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hh, r);
    ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function paintBackground(ctx, W, H) {
    ctx.fillStyle = '#07070A';
    ctx.fillRect(0, 0, W, H);

    let g = ctx.createRadialGradient(W * 0.22, H * 0.06, 0, W * 0.22, H * 0.06, W * 0.95);
    g.addColorStop(0, 'rgba(198,161,103,0.34)');
    g.addColorStop(0.45, 'rgba(198,161,103,0.10)');
    g.addColorStop(1, 'rgba(198,161,103,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    g = ctx.createRadialGradient(W * 0.92, H * 0.04, 0, W * 0.92, H * 0.04, W * 0.7);
    g.addColorStop(0, 'rgba(120,96,200,0.24)');
    g.addColorStop(1, 'rgba(120,96,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    g = ctx.createRadialGradient(W * 0.5, H * 1.02, 0, W * 0.5, H * 1.02, W * 0.9);
    g.addColorStop(0, 'rgba(234,213,162,0.16)');
    g.addColorStop(1, 'rgba(234,213,162,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawOrb(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#FFFBEF');
    g.addColorStop(0.42, '#EAD5A2');
    g.addColorStop(0.78, '#C6A167');
    g.addColorStop(1, '#7A5C28');
    ctx.save();
    ctx.shadowColor = 'rgba(234,213,162,0.45)';
    ctx.shadowBlur = r * 2.2;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all([
        document.fonts.load('400 120px "Instrument Serif"'),
        document.fonts.load('italic 400 120px "Instrument Serif"'),
        document.fonts.load('500 28px Inter'),
        document.fonts.load('600 28px Inter')
      ]);
    } catch (e) { /* fall back to system fonts */ }
  }

  function scoreWordFor(v) {
    if (v >= 9) return T('Exceptional');
    if (v >= 8) return T('Strong');
    if (v >= 7) return T('Good');
    if (v >= 6) return T('Solid');
    if (v >= 5) return T('Average');
    return T('Room to work');
  }

  async function buildShareCard(scan) {
    const W = 1080, H = 1350;
    await ensureFonts();
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    paintBackground(ctx, W, H);

    const pad = 84;

    // brand
    drawOrb(ctx, pad + 16, pad + 16, 15);
    ctx.fillStyle = '#F6F1E7';
    ctx.font = '400 40px ' + SERIF;
    ctx.textBaseline = 'middle';
    ctx.fillText('Lumorph', pad + 46, pad + 18);

    // date
    ctx.fillStyle = 'rgba(155,150,140,0.95)';
    ctx.font = '500 22px ' + SANS;
    ctx.textAlign = 'right';
    ctx.fillText(new Date(scan.ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }), W - pad, pad + 18);
    ctx.textAlign = 'left';

    // score
    const grad = ctx.createLinearGradient(0, 240, W * 0.7, 620);
    grad.addColorStop(0, '#FFF6DF');
    grad.addColorStop(0.5, '#EAD5A2');
    grad.addColorStop(1, '#C6A167');

    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = grad;
    ctx.font = '400 340px ' + SERIF;
    const scoreTxt = scan.overall.toFixed(1);
    ctx.fillText(scoreTxt, pad - 6, 620);

    const scoreW = ctx.measureText(scoreTxt).width;
    ctx.fillStyle = 'rgba(155,150,140,0.9)';
    ctx.font = '500 26px ' + SANS;
    ctx.fillText('out of 10', pad + scoreW + 26, 560);

    ctx.fillStyle = '#F6F1E7';
    ctx.font = '400 62px ' + SERIF;
    ctx.fillText(scoreWordFor(scan.overall), pad + scoreW + 26, 600);

    const tier = E.tierFor(scan.overall, (S.profile && S.profile.gender) || 'other');
    ctx.fillStyle = 'rgba(234,213,162,0.95)';
    ctx.font = '400 34px ' + SERIF;
    ctx.fillText(tier.label, pad + scoreW + 26, 650);

    // pillars
    const pillars = [
      ['harmony', T('Harmony')],
      ['angularity', T('Angularity')],
      ['dimorphism', T('Dimorphism')],
      ['features', T('Features')],
      ['skin', T('Skin signals')]
    ].filter(([id]) => scan.pillars[id] != null);

    let y = 760;
    const barX = pad + 250, barW = W - pad - barX - 90;
    pillars.forEach(([id, label]) => {
      const v = scan.pillars[id];
      ctx.fillStyle = 'rgba(246,241,231,0.92)';
      ctx.font = '500 26px ' + SANS;
      ctx.fillText(label, pad, y + 8);

      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      roundRect(ctx, barX, y - 6, barW, 12, 6);
      ctx.fill();

      const g2 = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      g2.addColorStop(0, '#8C6B33');
      g2.addColorStop(0.55, '#EAD5A2');
      g2.addColorStop(1, '#FFF3D6');
      ctx.fillStyle = g2;
      roundRect(ctx, barX, y - 6, Math.max(12, barW * (v / 10)), 12, 6);
      ctx.fill();

      ctx.fillStyle = '#EAD5A2';
      ctx.font = '400 30px ' + SERIF;
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(1), W - pad, y + 10);
      ctx.textAlign = 'left';
      y += 72;
    });

    // streak strip
    const st = streak();
    if (st > 0) {
      ctx.fillStyle = 'rgba(234,213,162,0.12)';
      roundRect(ctx, pad, H - 220, 300, 62, 31);
      ctx.fill();
      ctx.fillStyle = '#EAD5A2';
      ctx.font = '600 26px ' + SANS;
      ctx.fillText(st + (st === 1 ? ' day streak' : ' day streak'), pad + 28, H - 180);
    }

    // footer
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(pad, H - 118, W - pad * 2, 1);
    ctx.fillStyle = 'rgba(155,150,140,0.85)';
    ctx.font = '500 22px ' + SANS;
    ctx.fillText('lumorph.vercel.app', pad, H - 66);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(198,161,103,0.9)';
    ctx.fillText('lookmaxxing, free for everyone', W - pad, H - 66);
    ctx.textAlign = 'left';

    return cv;
  }

  async function shareResult(scan) {
    try {
      const cv = await buildShareCard(scan);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
      if (!blob) { toast('Could not build the card'); return; }
      const file = new File([blob], 'lumorph-' + todayKey() + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Lumorph' });
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return;
        }
      }
      const a = h('a', { href: URL.createObjectURL(blob), download: 'lumorph-' + todayKey() + '.png' });
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 600);
      toast('Card saved');
    } catch (e) {
      toast('Could not build the card');
    }
  }

  /* ---------- metric detail ---------- */
  function openMetric(scan, d) {
    const pts = E.METRIC_POINTS[d.id] || [];
    const body = h('div', {});

    const cv = h('canvas', { class: 'metric-canvas' });
    body.append(cv);

    const img = new Image();
    img.onload = () => {
      const W = 700;
      const H = Math.round((img.height / img.width) * W) || Math.round(W * 1.33);
      cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, W, H);

      // dim everything but the measurement
      ctx.fillStyle = 'rgba(7,7,10,0.45)';
      ctx.fillRect(0, 0, W, H);

      const lm = E.decodeLandmarks(scan.lm);
      if (lm && pts.length) {
        const p = pts.map((i) => ({ x: lm[i].x * W, y: lm[i].y * H }));
        ctx.strokeStyle = 'rgba(234,213,162,0.95)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(234,213,162,0.8)';
        ctx.shadowBlur = 12;
        if (p.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p[0].x, p[0].y);
          for (let i = 1; i < p.length; i++) ctx.lineTo(p[i].x, p[i].y);
          ctx.stroke();
        }
        p.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#FFF6DF';
          ctx.fill();
        });
      } else {
        ctx.fillStyle = 'rgba(246,241,231,0.8)';
        ctx.font = '500 22px ' + SANS;
        ctx.textAlign = 'center';
        ctx.fillText('Re-scan to see this drawn', W / 2, H / 2);
      }
    };
    if (scan.thumb) {
      img.src = scan.thumb;
    } else {
      cv.width = 700; cv.height = 500;
      const c0 = cv.getContext('2d');
      c0.fillStyle = '#0B0B10'; c0.fillRect(0, 0, 700, 500);
      c0.fillStyle = 'rgba(246,241,231,0.55)';
      c0.font = '500 22px ' + SANS;
      c0.textAlign = 'center';
      c0.fillText('Take a real scan to see this drawn', 350, 250);
    }

    body.append(
      h('div', { class: 'metric-read' },
        h('span', { class: 'big' }, d.score.toFixed(1)),
        h('span', { class: 'small' }, T('out of 10') + ' \u00b7 ' + txt(d.valueLabel, ''))),
      h('p', { class: 'small mt-12' }, d.tip || ''),
      h('button', { class: 'btn ghost mt-20', onclick: closeSheet }, 'Close')
    );

    openSheet(h('div', {},
      h('p', { class: 'eyebrow' }, T('Every measurement')),
      h('h2', { class: 'display sm', style: { marginTop: '6px' } }, d.label),
      h('div', { class: 'mt-16' }, body)));
  }

  /* ---------- weekly recap ---------- */
  function weekStats() {
    const now = Date.now();
    const week = 7 * 86400000;
    const recent = S.scans.filter((s) => now - s.ts <= week);
    const before = S.scans.filter((s) => now - s.ts > week && now - s.ts <= week * 2);
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b.overall, 0) / arr.length : null;
    const a1 = avg(recent), a0 = avg(before);
    const quests = Object.keys(S.quests).filter((k) => {
      const t = new Date(k).getTime();
      return now - t <= week && QUESTS.some((q) => S.quests[k][q.id]);
    }).length;
    let bestPillar = null;
    if (recent.length && before.length) {
      E.PILLARS.forEach((p) => {
        const d = avg(recent.map((s) => ({ overall: s.pillars[p.id] || 0 }))) - avg(before.map((s) => ({ overall: s.pillars[p.id] || 0 })));
        if (d > 0 && (!bestPillar || d > bestPillar.d)) bestPillar = { label: p.label, d };
      });
    }
    return {
      scans: recent.length,
      avg: a1,
      delta: (a1 != null && a0 != null) ? a1 - a0 : null,
      quests,
      bestPillar,
      streak: streak()
    };
  }

  function openRecap() {
    const w = weekStats();
    const row = (k, v) => h('div', { class: 'recap-row' }, h('span', { class: 'k' }, k), h('span', { class: 'v' }, v));
    openSheet(h('div', {},
      h('p', { class: 'eyebrow' }, 'Last seven days'),
      h('h2', { class: 'display sm', style: { marginTop: '6px' } }, 'Your week'),
      h('div', { class: 'mt-12' },
        row('Scans taken', String(w.scans)),
        row('Average score', w.avg != null ? w.avg.toFixed(1) : '\u2014'),
        row('Change', w.delta != null ? (w.delta >= 0 ? '+' : '') + w.delta.toFixed(1) : 'Need two weeks'),
        row('Days cleared', w.quests + ' of 7'),
        row('Current streak', w.streak + ' days'),
        w.bestPillar ? row('Biggest gain', w.bestPillar.label + ' +' + w.bestPillar.d.toFixed(1)) : null),
      h('p', { class: 'tiny mt-16' }, 'A week is short. Two scans in the same light tell you more than five taken in different rooms.'),
      h('button', { class: 'btn primary mt-20', onclick: closeSheet }, 'Close')));
  }

  /* ---------- report ---------- */
  function buildPdf(jpeg, imgW, imgH, pageW, pageH) {
    const enc = new TextEncoder();
    const parts = [];
    let len = 0;
    const put = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
    const offsets = [];
    const obj = (n, body) => { offsets[n] = len; put(n + ' 0 obj\n' + body + '\nendobj\n'); };

    put('%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>');
    const content = 'q ' + pageW + ' 0 0 ' + pageH + ' 0 0 cm /Im0 Do Q';
    obj(4, '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');

    offsets[5] = len;
    put('5 0 obj\n');
    put('<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n');
    put(jpeg);
    put('\nendstream\nendobj\n');

    const xref = len;
    put('xref\n0 6\n0000000000 65535 f \n');
    for (let i = 1; i <= 5; i++) put(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    put('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');

    return new Blob(parts, { type: 'application/pdf' });
  }

  async function buildReport(scan) {
    const W = 1240, H = 1754;
    await ensureFonts();
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#F7F4ED';
    ctx.fillRect(0, 0, W, H);

    const pad = 90;
    // header band
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#0B0B10');
    g.addColorStop(1, '#171410');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 300);

    drawOrb(ctx, pad + 18, 118, 16);
    ctx.fillStyle = '#F6F1E7';
    ctx.font = '400 44px ' + SERIF;
    ctx.textBaseline = 'middle';
    ctx.fillText('Lumorph', pad + 50, 120);
    ctx.fillStyle = 'rgba(198,161,103,0.95)';
    ctx.font = '500 18px ' + SANS;
    ctx.fillText('FACE & SKIN REPORT', pad + 50, 156);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(246,241,231,0.75)';
    ctx.font = '500 18px ' + SANS;
    ctx.fillText(new Date(scan.ts).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }), W - pad, 120);
    if (S.profile && S.profile.name) ctx.fillText(String(S.profile.name), W - pad, 152);
    ctx.textAlign = 'left';

    // score block
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1A1815';
    ctx.font = '400 190px ' + SERIF;
    ctx.fillText(scan.overall.toFixed(1), pad - 6, 520);
    const sw = ctx.measureText(scan.overall.toFixed(1)).width;
    ctx.fillStyle = '#6B655C';
    ctx.font = '500 22px ' + SANS;
    ctx.fillText('out of 10', pad + sw + 20, 470);
    ctx.fillStyle = '#1A1815';
    ctx.font = '400 44px ' + SERIF;
    ctx.fillText(scoreWordFor(scan.overall), pad + sw + 20, 520);

    const tier = E.tierFor(scan.overall, (S.profile && S.profile.gender) || 'other');
    ctx.fillStyle = '#8C6A2A';
    ctx.font = '400 34px ' + SERIF;
    ctx.fillText(tier.label, pad + sw + 20, 566);
    ctx.fillStyle = '#8E8880';
    ctx.font = '500 16px ' + SANS;
    ctx.fillText(tier.short + ' \u00b7 ' + tier.band, pad + sw + 20, 592);

    // pillars
    let y = 640;
    ctx.fillStyle = '#8C6A2A';
    ctx.font = '600 14px ' + SANS;
    ctx.fillText('PILLARS', pad, y);
    y += 46;
    E.PILLARS.forEach((p) => {
      const v = scan.pillars[p.id];
      if (v == null) return;
      ctx.fillStyle = '#1A1815';
      ctx.font = '500 22px ' + SANS;
      ctx.fillText(p.label, pad, y + 6);
      ctx.fillStyle = 'rgba(26,24,21,0.10)';
      roundRect(ctx, pad + 240, y - 8, W - pad * 2 - 320, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#8C6A2A';
      roundRect(ctx, pad + 240, y - 8, Math.max(10, (W - pad * 2 - 320) * (v / 10)), 10, 5);
      ctx.fill();
      ctx.fillStyle = '#1A1815';
      ctx.font = '400 24px ' + SERIF;
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(1), W - pad, y + 8);
      ctx.textAlign = 'left';
      y += 56;
    });

    // history
    y += 40;
    ctx.fillStyle = '#8C6A2A';
    ctx.font = '600 14px ' + SANS;
    ctx.fillText('RECENT SCANS', pad, y);
    y += 44;
    const rows = S.scans.slice(-8).reverse();
    rows.forEach((s) => {
      ctx.fillStyle = '#3A362F';
      ctx.font = '500 19px ' + SANS;
      ctx.fillText(new Date(s.ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), pad, y);
      ctx.fillStyle = '#1A1815';
      ctx.font = '400 24px ' + SERIF;
      ctx.textAlign = 'right';
      ctx.fillText(s.overall.toFixed(1), W - pad, y);
      ctx.textAlign = 'left';
      ctx.strokeStyle = 'rgba(26,24,21,0.10)';
      ctx.beginPath(); ctx.moveTo(pad, y + 16); ctx.lineTo(W - pad, y + 16); ctx.stroke();
      y += 44;
    });

    // footer
    ctx.strokeStyle = 'rgba(26,24,21,0.12)';
    ctx.beginPath(); ctx.moveTo(pad, H - 150); ctx.lineTo(W - pad, H - 150); ctx.stroke();
    ctx.fillStyle = '#6B655C';
    ctx.font = '500 16px ' + SANS;
    ctx.fillText('lumorph.vercel.app', pad, H - 108);
    ctx.textAlign = 'right';
    ctx.fillText('Appearance guidance, not medical advice.', W - pad, H - 108);
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(107,101,92,0.75)';
    ctx.font = '400 15px ' + SANS;
    ctx.fillText('Scores describe this photograph, not you. Light, angle and expression move them.', pad, H - 78);

    return cv;
  }

  async function downloadReport(scan) {
    try {
      const cv = await buildReport(scan);
      const dataUrl = cv.toDataURL('image/jpeg', 0.9);
      const b64 = dataUrl.split(',')[1];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = buildPdf(bytes, cv.width, cv.height, 595, 842);
      const a = h('a', { href: URL.createObjectURL(blob), download: 'lumorph-report-' + todayKey() + '.pdf' });
      document.body.append(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      toast('Report saved');
    } catch (e) {
      toast('Could not build the report');
    }
  }

  /* ---------- routine ---------- */
  function routineSteps() {
    const skin = S.profile.skin || [];
    const steps = [
      { title: 'Gentle cleanser', note: 'Twice a day, lukewarm water, no scrubbing. The single most reliable step.' },
      { title: 'Moisturiser', note: skin.includes('oily') ? 'Gel texture, thin layer. Hydration reduces oil rebound.' : 'Cream texture, applied on slightly damp skin.' },
      { title: 'Sunscreen, every morning', note: 'SPF 30+. This is the step that actually changes tone over months.' }
    ];
    if (skin.includes('acne')) steps.splice(1, 0, { title: 'Salicylic or azelaic acid', note: 'Two or three nights a week to start. More is not faster.' });
    if (skin.includes('dry')) steps.splice(1, 0, { title: 'Hydrating layer', note: 'Hyaluronic or glycerin serum under the moisturiser.' });
    if (skin.includes('sensitive')) steps.splice(1, 0, { title: 'Barrier cream at night', note: 'Ceramides and no fragrance. Cut actives for two weeks.' });
    if (skin.includes('dark')) steps.splice(1, 0, { title: 'Vitamin C in the morning', note: 'Under sunscreen. Eight weeks before you judge it.' });
    if ((S.profile.concerns || []).includes('eyes')) steps.push({ title: 'Sleep and salt', note: 'Under-eye shadow is mostly sleep, fluid and genetics. Creams are a distant fourth.' });
    if ((S.profile.concerns || []).includes('hair')) steps.push({ title: 'Hair and brow upkeep', note: 'A cut every six weeks, brows cleaned underneath only. Keep the natural line.' });
    return steps;
  }

  ROUTES.routine = function (root) {
    const steps = routineSteps();
    root.append(
      h('div', { class: 'rise', style: { '--i': 0 } },
        h('div', { class: 'row', style: { paddingTop: '6px', marginBottom: '14px' } },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => go('home') },
            h('span', { html: I.back, style: { display: 'grid', width: '18px', height: '18px' } }))),
        h('p', { class: 'eyebrow' }, 'Built from your profile'),
        h('h1', { class: 'display lg', style: { marginTop: '6px' } }, 'Skin ', h('em', {}, 'routine')),
        h('p', { class: 'lede' }, 'Short on purpose. A routine you actually finish beats a better one you abandon.')),
      h('div', { class: 'card mt-20 rise', style: { '--i': 1 } },
        h('div', { class: 'eyebrow', style: { marginBottom: '12px' } }, steps.length + ' steps'),
        steps.map((s, i) => h('div', { class: 'row gap-12', style: { padding: '12px 0', borderTop: i ? '1px solid var(--line)' : 'none' } },
          h('div', { class: 'pill gold', style: { width: '26px', height: '26px', padding: '0', justifyContent: 'center', flex: '0 0 auto' } }, String(i + 1)),
          h('div', {}, h('div', { style: { fontSize: '14px', fontWeight: '600' } }, s.title),
            h('div', { class: 'small' }, s.note))))),
      h('div', { class: 'card mt-16 rise', style: { '--i': 2 } },
        h('div', { class: 'eyebrow' }, 'No products, no links'),
        h('p', { class: 'small mt-8' }, 'Lumorph does not sell anything and does not take affiliate money. Any pharmacy own-brand version of these steps works the same.')),
      h('p', { class: 'tiny mt-16 rise', style: { '--i': 3 } },
        'General cosmetic guidance, not treatment advice. See a dermatologist for anything persistent or painful.')
    );
  };

  /* ---------- profile ---------- */
  ROUTES.profile = function (root) {
    const rk = rankOf(S.xp);
    const t = (S.profile.skin || []).map((id) => (SKIN_TYPES.find((s) => s.id === id) || {}).t).filter(Boolean).join(', ');
    const c = (S.profile.concerns || []).map((id) => (CONCERNS.find((s) => s.id === id) || {}).t).filter(Boolean).join(', ');
    root.append(
      h('div', { class: 'center mt-12 rise', style: { '--i': 0 } },
        h('div', { style: { width: '92px', height: '92px', margin: '0 auto', borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFF4D8, var(--gold) 45%, var(--gold-2) 85%)', display: 'grid', placeItems: 'center', fontFamily: 'var(--serif)', fontSize: '34px', color: '#171308' } },
          (S.profile.name || 'L')[0].toUpperCase()),
        h('h1', { class: 'display md', style: { marginTop: '14px' } }, txt(S.profile.name, 'You')),
        h('div', { class: 'row gap-8', style: { justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' } },
          h('span', { class: 'pill gold' }, 'Free forever'),
          h('span', { class: 'pill plain' }, 'Rank: ' + rk.name),
          BADGES.filter((b) => S.badges && S.badges[b.id]).map((b) =>
            h('span', { class: 'pill badge-pill' }, h('span', { class: 'dot' }), b.label)))),

      h('p', { class: 'eyebrow mt-28 rise', style: { '--i': 1 } }, T('About you')),
      h('div', { class: 'card mt-12 rise', style: { '--i': 2 } },
        h('div', { class: 'row between' },
          kv(T('Gender'), (S.profile.gender || '\u2014').replace(/^./, (m) => m.toUpperCase())),
          kv(T('Age'), S.profile.birth ? String(ageFrom(S.profile.birth)) : '\u2014'),
          kv(T('Height'), S.profile.height ? S.profile.height + ' cm' : '\u2014'))),

      h('p', { class: 'eyebrow mt-20 rise', style: { '--i': 3 } }, T('Skin')),
      h('div', { class: 'card mt-12 rise', style: { '--i': 4 } },
        h('div', { class: 'item', style: { padding: '6px 0' } },
          h('span', { class: 'ico' }, h('span', { html: I.drop, style: { width: '18px', height: '18px', display: 'grid' } })),
          h('div', { class: 'txt' }, h('div', { class: 't' }, t || T('Balanced')), h('div', { class: 's' }, 'Skin type'))),
        h('div', { class: 'item', style: { padding: '6px 0' } },
          h('span', { class: 'ico' }, h('span', { html: I.target, style: { width: '18px', height: '18px', display: 'grid' } })),
          h('div', { class: 'txt' }, h('div', { class: 't' }, c || T('General maintenance')), h('div', { class: 's' }, T('Focus'))))),

      h('p', { class: 'eyebrow mt-20 rise', style: { '--i': 5 } }, 'Account'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 6 } },
        linkRow('Edit name', 'Change what the app calls you', I.pencil, () => editName()),
        linkRow('Settings & privacy', 'Appearance, data, export', I.gear, () => go('settings')),
        linkRow('How scores work', 'The full rubric, in plain language', I.info, () => go('how'))),
      h('p', { class: 'tiny center mt-20 rise', style: { '--i': 7 } },
        'Everything lives in this browser. No account, no server, no upload.')
    );
  };

  function kv(k, v) {
    return h('div', {},
      h('div', { class: 'tiny', style: { letterSpacing: '0.12em', textTransform: 'uppercase' } }, k),
      h('div', { class: 'display sm', style: { marginTop: '4px' } }, v));
  }
  function linkRow(t, s, icon, fn) {
    return h('button', { class: 'item', style: { width: '100%', textAlign: 'left' }, onclick: fn },
      h('span', { class: 'ico', html: icon, style: { display: 'grid' } }),
      h('div', { class: 'txt' }, h('div', { class: 't' }, t), h('div', { class: 's' }, s)),
      h('span', { class: 'chev', html: I.chev, style: { display: 'grid' } }));
  }
  function editName() {
    const input = h('input', { class: 'input', value: S.profile.name, maxlength: '24' });
    openSheet(h('div', {},
      h('h2', { class: 'display sm' }, 'Your name'),
      h('p', { class: 'small mt-8' }, 'Only used to greet you. It never leaves the device.'),
      h('div', { class: 'mt-16' }, input),
      h('div', { class: 'row gap-10 mt-20' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: () => {
          S.profile.name = (input.value || 'Friend').trim().slice(0, 24);
          save(); closeSheet(); go('profile'); toast('Saved');
        } }, 'Save'))));
  }

  /* ---------- settings ---------- */
  function notifPerm() {
    return ('Notification' in window) ? Notification.permission : 'unsupported';
  }
  function notifSettings() {
    S.settings = S.settings || {};
    if (!S.settings.notif) {
      S.settings.notif = { enabled: false, daily: true, time: '20:00', streak: true, weekly: true, lastFired: '' };
    }
    return S.settings.notif;
  }

  async function askNotifications() {
    if (!('Notification' in window)) { toast('This browser cannot show notifications'); return; }
    if (Notification.permission === 'granted') { notifSettings().enabled = true; save(); go('settings'); return; }
    if (Notification.permission === 'denied') {
      toast('Blocked in browser settings \u2014 re-enable it there');
      return;
    }
    try {
      const p = await Notification.requestPermission();
      if (p === 'granted') {
        notifSettings().enabled = true;
        save();
        toast('Reminders on');
        try {
          new Notification('Lumorph', { body: 'Reminders are on. We will nudge you once a day.', icon: './icons/icon-192.png' });
        } catch (e) { /* some browsers need a service worker */ }
        scheduleReminders();
        registerPeriodicSync();
      } else {
        toast('Notifications stayed off');
      }
      go('settings');
    } catch (e) { toast('Could not ask for permission'); }
  }

  let notifTimer = null;
  function scheduleReminders() {
    clearTimeout(notifTimer);
    notifTimer = null;
    const n = notifSettings();
    if (!n.enabled || notifPerm() !== 'granted') return;
    const parts = (n.time || '20:00').split(':');
    const hh = Number(parts[0]) || 20, mm = Number(parts[1]) || 0;
    const now = new Date();
    const next = new Date();
    next.setHours(hh, mm, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = Math.min(next - now, 2147483000);
    notifTimer = setTimeout(fireReminder, delay);
  }

  function fireReminder() {
    const n = notifSettings();
    if (!n.enabled || notifPerm() !== 'granted') return;
    const key = todayKey();
    if (n.lastFired === key) { scheduleReminders(); return; }
    const q = dayQuests();
    const done = QUESTS.filter((x) => q[x.id]).length;
    if (done < 6) {
      const left = 6 - done;
      const body = done === 0
        ? 'No quests cleared today. Two minutes keeps the streak alive.'
        : left + ' quest' + (left === 1 ? '' : 's') + ' left today.';
      try {
        new Notification('Lumorph', { body, icon: './icons/icon-192.png', tag: 'lumorph-daily' });
      } catch (e) { /* ignore */ }
    }
    n.lastFired = key;
    save();
    scheduleReminders();
  }

  function registerPeriodicSync() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      if (!('periodicSync' in reg)) return;
      reg.periodicSync.register('lumorph-daily', { minInterval: 24 * 60 * 60 * 1000 }).catch(() => {});
    }).catch(() => {});
  }

  function tileSeg(options, value, onPick) {
    const wrap = h('div', { class: 'tiles' });
    options.forEach((o) => {
      wrap.append(h('button', {
        'aria-pressed': String(value === o.id),
        dataset: { id: o.id },
        onclick: () => {
          wrap.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === o.id)));
          onPick(o.id);
        }
      }, h('span', { html: o.icon, style: { display: 'grid' } }), o.label));
    });
    return wrap;
  }

  function growRow(cfg) {
    const kids = [
      cfg.icon ? h('span', { class: 'tile', html: cfg.icon, style: { display: 'grid' } }) : null,
      h('div', { class: 'grow' },
        h('div', { class: 'tt' }, cfg.title),
        cfg.sub ? h('div', { class: 'ts' }, cfg.sub) : null),
    ];
    if (cfg.right) kids.push(cfg.right);
    else if (cfg.tick) kids.push(h('span', { class: 'ok-tick' }, h('span', { html: I.check, style: { display: 'grid' } })));
    else if (cfg.chev) kids.push(h('span', { class: 'rt', html: I.chev }));
    else if (cfg.ext) kids.push(h('span', { class: 'rt', html: I.external }));
    else if (cfg.down) kids.push(h('span', { class: 'rt', html: I.download }));

    const el = h(cfg.onClick ? 'button' : 'div', {
      class: 'grow-row' + (cfg.danger ? ' danger' : '') + (cfg.onClick ? '' : ' static'),
      onclick: cfg.onClick || null
    }, kids);
    return el;
  }

  function switchEl(on, onChange) {
    const el = h('button', { class: 'switch', role: 'switch', 'aria-checked': String(!!on) },
      h('span', {}));
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const next = el.getAttribute('aria-checked') !== 'true';
      el.setAttribute('aria-checked', String(next));
      onChange(next);
    });
    return el;
  }

  ROUTES.settings = function (root) {
    const n = notifSettings();
    const perm = notifPerm();
    const consent = S.consent && S.consent.at
      ? new Date(S.consent.at).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'Not recorded';

    root.append(
      h('div', { class: 'rise', style: { '--i': 0 } },
        h('div', { class: 'row', style: { paddingTop: '6px', marginBottom: '16px' } },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => go('profile') },
            h('span', { html: I.back, style: { display: 'grid', width: '18px', height: '18px' } }))),
        h('p', { class: 'eyebrow' }, 'Lumorph'),
        h('h1', { class: 'display lg', style: { marginTop: '6px' } }, 'Settings & ', h('em', {}, 'Privacy'))),

      /* appearance */
      h('p', { class: 'sect rise', style: { '--i': 1 } }, T('Appearance')),
      h('div', { class: 'rise', style: { '--i': 2 } },
        tileSeg([
          { id: 'dark', label: T('Dark'), icon: I.moon },
          { id: 'light', label: T('Light'), icon: I.sun },
          { id: 'system', label: T('System'), icon: I.gear }
        ], S.theme, (id) => { S.theme = id; save(); applyTheme(); })),

      /* selfie photos */
      h('p', { class: 'sect rise', style: { '--i': 2.5 } }, T('Language')),
      h('div', { class: 'rise', style: { '--i': 2.6 } },
        tileSeg((I18N ? I18N.languages : [{ id: 'en', label: 'English' }]).map((l) => ({
          id: l.id, label: l.label, icon: I.globe
        })), (S.settings.lang || 'en'), (id) => {
          S.settings.lang = id;
          if (I18N) I18N.set(id);
          save();
          go('settings');
        })),

      h('p', { class: 'sect rise', style: { '--i': 3 } }, T('Selfie photos')),
      h('div', { class: 'rise', style: { '--i': 4 } },
        tileSeg([
          { id: 'auto', label: T('Automatic'), icon: I.sparkle },
          { id: 'flipped', label: T('Flipped'), icon: I.flip },
          { id: 'as-is', label: T('As saved'), icon: I.image }
        ], (S.settings.mirror || 'auto'), (id) => { S.settings.mirror = id; save(); toast(id === 'flipped' ? 'Camera photos will be flipped' : id === 'as-is' ? 'Photos saved exactly as captured' : 'Handled automatically'); })),
      h('p', { class: 'helper rise', style: { '--i': 5 } },
        'If a photo from your camera looks reversed next to the live preview, choose Flipped. Photos you upload are never changed.'),

      /* notifications */
      h('p', { class: 'sect rise', style: { '--i': 6 } }, T('Notifications')),
      perm === 'granted'
        ? h('div', { class: 'group rise', style: { '--i': 7 } },
            growRow({
              icon: I.bell, title: 'Daily reminder',
              sub: 'One nudge a day, only if quests are left.',
              right: switchEl(n.enabled, (v) => { n.enabled = v; save(); scheduleReminders(); if (v) fireIfDue(); })
            }),
            n.enabled ? growRow({
              icon: I.clock, title: 'Reminder time',
              right: h('input', {
                type: 'time', class: 'input', value: n.time || '20:00',
                style: { width: '110px', height: '40px', padding: '0 10px', fontSize: '14px', marginLeft: 'auto' },
                onchange: (e) => { n.time = e.target.value || '20:00'; save(); scheduleReminders(); }
              })
            }) : null,
            growRow({
              icon: I.bolt, title: 'Streak warning',
              sub: 'A second nudge late evening if the streak is at risk.',
              right: switchEl(n.streak, (v) => { n.streak = v; save(); })
            }),
            growRow({
              icon: I.refresh, title: T('Weekly re-scan'),
              sub: 'Sunday morning reminder to take the next scan.',
              right: switchEl(n.weekly, (v) => { n.weekly = v; save(); })
            })
          )
        : h('div', { class: 'group rise', style: { '--i': 7 } },
            growRow({
              icon: I.bell, title: perm === 'denied' ? 'Notifications are blocked' : 'Turn on reminders',
              sub: perm === 'denied'
                ? 'Your browser is blocking them. Allow notifications for this site in its settings, then come back.'
                : 'A daily nudge, a streak warning and a weekly scan reminder. Nothing else, ever.',
              ext: perm === 'denied',
              onClick: perm === 'denied' ? null : askNotifications
            })),

      /* ai */
      h('p', { class: 'sect rise', style: { '--i': 7.5 } }, 'AI read'),
      h('div', { class: 'group rise', style: { '--i': 7.6 } },
        growRow({
          icon: I.sparkle, title: 'Second opinion',
          sub: 'Sends the photo to Google Gemini for a model read, blended with your score.',
          right: switchEl(!!aiSettings().consent, (v) => {
            aiSettings().consent = v;
            save();
            toast(v ? 'AI read on \u2014 photos are sent when you ask' : 'AI read off \u2014 nothing leaves this device');
          })
        })),
      h('p', { class: 'helper rise', style: { '--i': 7.7 } },
        'Off by default. While it is on, each new scan sends one photo to Google. Everything else \u2014 scores, quests, history \u2014 still never leaves this device.'),

      /* scores & legal */
      h('p', { class: 'sect rise', style: { '--i': 8 } }, T('Scores & legal')),
      h('div', { class: 'group rise', style: { '--i': 9 } },
        growRow({ icon: I.sigma, title: 'How we calculate your scores', sub: 'What each score measures, and what it cannot tell you.', chev: true, onClick: () => go('how') }),
        growRow({ icon: I.doc, title: 'Privacy Policy', sub: 'What is stored, and where it lives.', chev: true, onClick: () => openDoc('privacy') }),
        growRow({ icon: I.terms, title: 'Terms of Service', sub: 'What to expect when you use Lumorph.', chev: true, onClick: () => openDoc('terms') }),
        growRow({ icon: I.person, title: 'How deletion works', sub: 'What happens when you delete your data.', chev: true, onClick: () => openDoc('deletion') }),
        growRow({ icon: I.shield, title: 'Data consent', sub: consent, tick: true })
      ),

      /* promo */
      h('p', { class: 'sect rise', style: { '--i': 10 } }, T('Promo')),
      h('div', { class: 'group rise', style: { '--i': 11 } },
        growRow({ icon: I.gift, title: T('Redeem a promo code'), sub: 'Got a code from a creator or a friend?', chev: true, onClick: redeemPromo })),

      /* subscription */
      h('p', { class: 'sect rise', style: { '--i': 12 } }, T('Subscription')),
      h('div', { class: 'group rise', style: { '--i': 13 } },
        growRow({ icon: I.check, title: T('No subscription. Ever.'), sub: 'There is nothing to buy, restore or cancel.', tick: true })),

      /* data */
      h('p', { class: 'sect rise', style: { '--i': 14 } }, T('Data & account')),
      h('div', { class: 'group rise', style: { '--i': 15 } },
        growRow({ icon: I.braces, title: T('Export as JSON'), sub: 'Every scan, measurement and quest.', down: true, onClick: exportJson }),
        growRow({ icon: I.table, title: T('Export as spreadsheets'), sub: 'The same data as CSV, one file per table.', down: true, onClick: exportCsv })),
      h('div', { class: 'group rise', style: { '--i': 16, marginTop: '14px' } },
        growRow({ icon: I.trash, title: T('Delete all data'), sub: 'Permanently removes every scan from this device.', danger: true, chev: true, onClick: confirmWipe })),

      h('p', { class: 'tiny center mt-20 rise', style: { '--i': 17 } },
        'Lumorph v2 \u00b7 free, offline, no accounts')
    );
  };

  function fireIfDue() {
    const n = notifSettings();
    if (!n.enabled) return;
    const parts = (n.time || '20:00').split(':');
    const now = new Date();
    const due = new Date();
    due.setHours(Number(parts[0]) || 20, Number(parts[1]) || 0, 0, 0);
    if (now >= due && n.lastFired !== todayKey()) fireReminder();
  }

  /* ---------- documents ---------- */
  const DOCS = {
    privacy: {
      title: 'Privacy Policy',
      body: [
        ['h', 'The short version'],
        ['p', 'Lumorph has no server. Your photos, measurements, quests and scores are stored in this browser on this device. Nothing is uploaded, transmitted, sold or shared, because there is nowhere for it to go.'],
        ['h', 'What is stored'],
        ['p', 'Your profile answers (name, gender, birth date, height, skin type, focus), the score and pillar values of each scan, a small thumbnail of each scan, and your quest history.'],
        ['p', 'Face landmarks, the 478 measured points, are computed and discarded within the same moment. They are never written to storage.'],
        ['h', 'AI read, if you turn it on'],
        ['p', 'Off by default. While it is on, each scan sends one photo to Google Gemini to get a model estimate of attractiveness, harmony and skin. The photo is sent over HTTPS, used for that one answer, and not stored by Lumorph \u2014 there is no Lumorph server to store it on. Google\u2019s handling is governed by their API terms.'],
        ['p', 'Turn it off in Settings and no photo leaves this device again. Scans you take while it is off are never sent, and existing scans are never re-sent unless you tap the button yourself.'],
        ['h', 'What is not stored'],
        ['p', 'No location, no contacts, no device identifiers, no analytics, no advertising identifiers, no crash reports. Lumorph makes no network request of its own after the app has loaded.'],
        ['h', 'Third parties'],
        ['p', 'Two public resources are downloaded once and then cached: the MediaPipe face landmarker and the two typefaces. Both are served by their own CDNs, which see a normal web request and nothing about your face. After that the app runs offline.'],
        ['h', 'Deleting'],
        ['p', 'Delete all data in Settings removes everything immediately and permanently. Clearing your browser data does the same. Export first if you want a copy.'],
        ['h', 'Children'],
        ['p', 'Lumorph is not intended for anyone under 13, and the app refuses a birth date that would make you younger.']
      ]
    },
    terms: {
      title: 'Terms of Service',
      body: [
        ['h', 'What Lumorph is'],
        ['p', 'An appearance and self-improvement tool. It measures proportions in a photograph and turns them into scores you can track over time.'],
        ['h', 'What it is not'],
        ['p', 'It is not a medical device and it does not diagnose, treat or screen for any condition. Nothing in the app is medical, dermatological or psychological advice.'],
        ['p', 'The scores are estimates from a single photograph. They describe the photo, not you, and they say nothing about your worth.'],
        ['h', 'Using it'],
        ['p', 'Take your own photos, or photos you have permission to use. Do not use Lumorph to rate other people.'],
        ['h', 'Cost'],
        ['p', 'Lumorph is free. There is no subscription, no in-app purchase and no advertising.'],
        ['h', 'Changes'],
        ['p', 'The scoring bands are calibrated over time. If a score shifts after an update, that is the yardstick moving, not you.']
      ]
    },
    deletion: {
      title: 'How deletion works',
      body: [
        ['h', T('Delete all data')],
        ['p', 'Settings, then Delete all data. Every scan, thumbnail, quest and profile answer is erased from this browser in the same moment. There is no copy anywhere else, so there is nothing left to recover.'],
        ['h', 'What goes'],
        ['p', 'Your profile, all scans and their thumbnails, the quest history, XP and ranks, your consent record and your notification preferences.'],
        ['h', 'What stays'],
        ['p', 'Nothing. The app returns to the first screen as if it had never been opened.'],
        ['h', 'Before you delete'],
        ['p', 'Export as JSON or CSV if you want a record. Deletion cannot be undone.'],
        ['h', 'Clearing browser data'],
        ['p', 'Clearing site data in your browser does the same thing, without asking first. That is a browser action, not something Lumorph can prevent.']
      ]
    }
  };

  function openDoc(id) {
    const d = DOCS[id];
    if (!d) return;
    const kids = [h('h2', { class: 'display sm' }, d.title)];
    d.body.forEach(([kind, text]) => {
      kids.push(kind === 'h' ? h('h3', {}, text) : h('p', {}, text));
    });
    kids.push(h('button', { class: 'btn primary mt-20', onclick: closeSheet }, 'Close'));
    openSheet(h('div', { class: 'doc' }, kids));
  }

  function redeemPromo() {
    const input = h('input', {
      class: 'input', placeholder: 'Enter code', maxlength: '8',
      autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false',
      oninput: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); }
    });
    const msg = h('p', { class: 'field-error', style: { marginTop: '12px' } }, '');
    const show = (t) => { msg.textContent = t; msg.classList.add('on'); };

    const apply = () => {
      const raw = (input.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!raw) return show('Enter a code.');
      if (raw.length < 4 || raw.length > 8) return show('Codes are 4 to 8 characters.');

      const tries = S.promoTries || { n: 0, until: 0 };
      if (tries.until && tries.until > Date.now()) {
        return show('Too many attempts. Try again in ' + Math.ceil((tries.until - Date.now()) / 1000) + ' seconds.');
      }

      const key = digest(CODE_SALT + raw);
      const reward = CODES[key];
      if (!reward) {
        const n = (tries.n || 0) + 1;
        S.promoTries = n >= 5 ? { n: 0, until: Date.now() + 60000 } : { n, until: 0 };
        save();
        return show('That code is not valid.');
      }

      S.promos = S.promos || {};
      if (S.promos[key]) return show('That code has already been used on this device.');

      S.promos[key] = Date.now();
      S.xp += reward.xp;
      S.badges = S.badges || {};
      if (reward.badge) S.badges[reward.badge] = true;
      S.promoTries = { n: 0, until: 0 };
      save();
      closeSheet();
      haptic(20);
      toast('+' + reward.xp + ' XP' + (reward.label ? ' \u00b7 ' + reward.label + ' unlocked' : ''));
      go('settings');
    };

    openSheet(h('div', {},
      h('h2', { class: 'display sm' }, T('Redeem a promo code')),
      h('p', { class: 'small mt-12' }, 'Lumorph has nothing to sell, so a code never unlocks a paid feature. Codes are 4 to 8 characters, come from a creator or a friend, and work once per device.'),
      h('div', { class: 'mt-16' }, input),
      msg,
      h('div', { class: 'row gap-10 mt-20' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: apply }, 'Apply'))));

    setTimeout(() => { try { input.focus({ preventScroll: true }); } catch (e) {} }, 320);
  }

  function confirmWipe() {
    openSheet(h('div', {},
      h('h2', { class: 'display sm' }, 'Delete everything?'),
      h('p', { class: 'small mt-12' }, 'This removes every scan, photo, quest and profile answer from this browser. It cannot be undone, and there is no copy anywhere else.'),
      h('div', { class: 'row gap-10 mt-20' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Keep it'),
        h('button', { class: 'btn danger', onclick: () => {
          try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
          S = blank();
          notifSettings();
          closeSheet();
          onb = null;
          go('onboarding');
          toast('Everything deleted');
        } }, 'Delete'))));
  }

  function downloadFile(name, text, type) {
    const blob = new Blob([text], { type });
    const a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  function exportJson() {
    downloadFile('lumorph-export-' + todayKey() + '.json', JSON.stringify(S, null, 2), 'application/json');
    toast('Exported');
  }

  function exportCsv() {
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const scanRows = [['scan_id', 'date', 'overall', 'harmony', 'angularity', 'dimorphism', 'features', 'skin'].join(',')];
    S.scans.forEach((s) => {
      scanRows.push([
        esc(s.id), esc(new Date(s.ts).toISOString()), s.overall,
        s.pillars.harmony, s.pillars.angularity, s.pillars.dimorphism, s.pillars.features, s.pillars.skin
      ].join(','));
    });
    downloadFile('lumorph-scans-' + todayKey() + '.csv', scanRows.join('\n'), 'text/csv');

    const questRows = [['date'].concat(QUESTS.map((q) => q.id)).join(',')];
    Object.keys(S.quests).sort().forEach((k) => {
      const q = S.quests[k];
      questRows.push([k].concat(QUESTS.map((x) => (q[x.id] ? 1 : 0))).join(','));
    });
    setTimeout(() => {
      downloadFile('lumorph-quests-' + todayKey() + '.csv', questRows.join('\n'), 'text/csv');
    }, 300);
    toast('Exported');
  }

  /* ---------- how scores work ---------- */
  ROUTES.how = function (root) {
    const sec = (title, paras) => h('div', { class: 'doc', style: { marginTop: '26px' } },
      h('h3', { style: { marginTop: 0 } }, title),
      paras.map((p) => h('p', {}, p)));

    root.append(
      h('div', { class: 'rise', style: { '--i': 0 } },
        h('div', { class: 'row', style: { paddingTop: '6px', marginBottom: '16px' } },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => go('settings') },
            h('span', { html: I.back, style: { display: 'grid', width: '18px', height: '18px' } }))),
        h('p', { class: 'eyebrow' }, 'Transparency'),
        h('h1', { class: 'display lg', style: { marginTop: '6px' } }, 'How these numbers are ', h('em', {}, 'calculated')),
        h('p', { class: 'lede' }, 'No black box. Every input, every weight, and the limits of what a photograph can tell you.')),

      h('div', { class: 'card mt-20 rise', style: { '--i': 1 } },
        h('p', { class: 'doc' }, h('span', { class: 'note', style: { display: 'block' } },
          'The numbers describe your photo, not you. They say nothing about your worth, and Lumorph never compares you with another person.'))),

      h('div', { class: 'rise', style: { '--i': 2 } },
        sec(T('Face analysis'), [
          'Lumorph measures proportions of your face from one front photo: how the parts of the face relate to each other in width, height and angle. Everything runs on this device.',
          'Google\u2019s MediaPipe Face Landmarker finds 478 points on your face. The points are used to compute the measurements and are then discarded \u2014 never uploaded, never stored, never written to disk.',
          'While you hold still before capture, several frames are averaged so the measurements do not jitter. If you upload a photo instead, the numbers come from that single frame.'
        ]),
        sec('The five groups', [
          'Harmony (30% of the overall score): mirror symmetry, the facial thirds, the facial fifths, eye spacing and the midface ratio.',
          'Angularity (20%): jaw width relative to cheek width, the gonial angle, and chin width.',
          'Dimorphism (15%): how strongly your features read as your stated gender \u2014 brow prominence, jaw width, lip fullness, cheekbone width.',
          'Features (25%): canthal tilt, eye aperture, nose width against the eye gap, philtrum to chin, mouth to nose width, upper to lower lip.',
          'Skin signals (10%): an appearance rating read from the colours and brightness of the same photo.'
        ]),
        sec('How a measurement becomes a score', [
          'Each measurement is compared with a reference band. Inside the band it scores 10. Outside it, the score falls away smoothly rather than dropping off a cliff, so two similar faces produce two similar numbers.',
          'A group score is the average of its measurements. The overall score is the weighted average of the groups, rounded to one decimal.',
          'The same photo always produces the same score. There is no randomness and no model adjusting the result.'
        ]),
        sec(T('Skin signals'), [
          'The skin score is an appearance rating of the photograph, not a measurement of your skin. No hydration, oil, blood flow, UV or any other bodily value is read, computed or stored.',
          'Five signals are read from the pixels: tone variance across the cheeks and forehead, redness, under-eye contrast, T-zone shine, and high-frequency texture. It is deterministic arithmetic on the image.',
          'Because it reads a photo, light, camera, lens and make-up move these numbers as much as your skin does. Treat them as a rough trend line for your own photos over time.'
        ]),
        sec('What affects accuracy', [
          'Head angle, distance, lens, lighting and expression all change these numbers. The scanner checks your head angle, light, sharpness and stillness before it will capture, which reduces this but cannot remove it.',
          'Compare scans taken the same way: same room, same light, same distance, phone at eye level. A score that moves because you moved the lamp is not progress.'
        ]),
        sec('What is not measured', [
          'The upper third of the face above the hairline, hair density, and anything that needs a true side view. There is no side-profile capture yet, so chin projection and the side gonial angle are not part of your score.',
          'Nothing about health, hormones, body composition or age is inferred.'
        ]),
        sec('What Lumorph keeps', [
          'The scores from each saved scan, on this device only, plus a small thumbnail of the photo so you can see your history.',
          'Not the 478 face points, not the raw measurement values, and nothing at all on a server \u2014 there is no server.'
        ]),
        sec('Not medical advice', [
          'Lumorph does not diagnose, treat or screen for any condition, and nothing here is a medical assessment. The scores are estimates from your photos, not personalised advice.',
          'Speak to a doctor or dermatologist before acting on anything you see here, especially if you are pregnant, breastfeeding, under 18, or managing a medical condition.',
          'Lumorph must never be used to check for acne, moles, skin cancer or anything else. See a dermatologist for that.'
        ])),

      h('div', { class: 'row gap-10 mt-20 rise', style: { '--i': 3 } },
        h('button', { class: 'btn ghost', onclick: () => go('settings') }, 'Back to settings'),
        h('button', { class: 'btn primary', onclick: () => go('home') }, T('Home')))
    );
  };

  /* ---------------- theme ---------------- */
  function applyTheme() {
    const t = S.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : S.theme;
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#F6F3EC' : '#07070A');
  }

  if (window.matchMedia) {
    try {
      window.matchMedia('(prefers-color-scheme: light)')
        .addEventListener('change', () => { if (S.theme === 'system') applyTheme(); });
    } catch (e) { /* older browser */ }
  }

  /* ---------------- demo seed ---------------- */
  function seedDemo() {
    const keepTheme = S.theme;
    S = blank();
    S.theme = keepTheme;
    S.onboarded = true;
    S.profile = { name: 'Soham', gender: 'male', birth: '2001-11-18', height: 178, skin: ['balanced', 'oily'], concerns: ['clarity', 'definition', 'eyes'] };
    S.consent = { type: 'local-analysis', at: Date.now() };
    S.theme = 'dark';
    const targets = [6.4, 6.7, 6.6, 7.1, 7.3, 7.2, 7.6, 7.8];
    const now = Date.now();
    targets.forEach((target, i) => {
      const lm = E.demoLandmarks(1000 + i * 37);
      const m = E.rawMetrics(lm, 1080, 1440);
      const base = E.score(m, 'male');
      const shift = target - base.overall;
      const pillars = {};
      E.PILLARS.forEach((p) => {
        const v = base.pillars[p.id];
        pillars[p.id] = v == null ? null : Math.max(1, Math.min(10, Math.round((v + shift * 0.9) * 10) / 10));
      });
      const details = base.details.map((d) => ({
        ...d, score: Math.max(1, Math.min(10, Math.round((d.score + shift) * 10) / 10))
      }));
      // synthetic skin signals: demo faces have no pixels to read
      const skinSeeds = [
        ['evenness', 'Tone evenness', '6% var'], ['redness', 'Redness', '7%'],
        ['underEye', 'Under-eye shadow', '4%'], ['shine', 'T-zone shine', '64%'],
        ['texture', 'Texture', '0.031']
      ];
      skinSeeds.forEach(([id, label, valueLabel], k) => {
        details.push({
          id, label, pillar: 'skin', value: 0, valueLabel,
          score: Math.max(1, Math.min(10, Math.round((target - 0.6 + (k % 3) * 0.5) * 10) / 10)),
          tip: 'Consistency beats intensity: the same simple routine for sixty days.'
        });
      });
      pillars.skin = Math.round((target - 0.4) * 10) / 10;
      S.scans.push({
        id: 'demo' + i, ts: now - (targets.length - i) * 6 * 86400000,
        overall: target, pillars, details,
        focus: details.slice().sort((a, b) => a.score - b.score).slice(0, 3),
        metrics: m, quality: { ok: true, chips: [] }, thumb: null
      });
    });
    S._open = S.scans[S.scans.length - 1].id;
    // quest history so streaks and the heatmap have something to show
    for (let i = 1; i < 26; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (i % 7 === 0) continue;
      const k = todayKey(d);
      const n = (i * 7) % 5;
      S.quests[k] = {};
      QUESTS.slice(0, n).forEach((q) => { S.quests[k][q.id] = true; });
    }
    S.quests[todayKey()] = { am: true, water: true };
    S.xp = 1180;
    save();
  }

  /* ---------------- boot ---------------- */
  load();
  S.settings = S.settings || {};
  if (I18N) I18N.set(S.settings.lang || 'en');
  const themeParam = (location.search.match(/theme=(dark|light|system)/) || [])[1];
  if (themeParam) S.theme = themeParam;
  applyTheme();
  if (/demo=1/.test(location.search)) seedDemo();

  const startRoute = (location.hash || '').replace('#/', '') || (S.onboarded ? 'home' : 'onboarding');
  if (!S.onboarded) {
    paint('onboarding');
  } else {
    paint(ROUTES[startRoute] ? startRoute : 'home');
  }
  history.replaceState({ r: S.onboarded ? (ROUTES[startRoute] ? startRoute : 'home') : 'onboarding' }, '', location.href);

  /* branded splash: hold just long enough to read, then get out of the way */
  (function dismissSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    const started = performance.now();
    const MIN = 820;
    setTimeout(() => {
      splash.classList.add('gone');
      setTimeout(() => { if (splash.parentNode) splash.remove(); }, 620);
    }, Math.max(0, MIN - (performance.now() - started)));
  })();

  notifSettings();
  scheduleReminders();
  setTimeout(fireIfDue, 1200);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
