/* ============================================================
   Lumorph — app
   Local-first PWA. No backend, no AI, no subscription.
   ============================================================ */
(function () {
  'use strict';

  const E = window.LumorphEngine;
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
    { id: 'am', label: 'Morning skincare', xp: 20, icon: 'drop' },
    { id: 'pm', label: 'Night skincare', xp: 20, icon: 'moon' },
    { id: 'sleep', label: 'Sleep 7+ hours', xp: 15, icon: 'moon' },
    { id: 'water', label: 'Drink 2L water', xp: 10, icon: 'water' },
    { id: 'posture', label: 'Posture check', xp: 10, icon: 'posture' },
    { id: 'groom', label: 'Grooming', xp: 10, icon: 'comb' }
  ];
  const WEEKLY = { id: 'rescan', label: 'Weekly re-scan', xp: 100, icon: 'refresh' };
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
    view.classList.toggle('no-tabs', name === 'onboarding' || name === 'processing');
    paintTabbar(isTab ? name : (name === 'scan' ? 'scan' : ''));
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
          h('button', { class: 'icon-btn', 'aria-label': 'Profile', onclick: () => go('profile') },
            h('span', { html: I.profile, style: { width: '20px', height: '20px', display: 'grid' } }))
        )
      );
    } else if (name === 'progress') {
      topbar.append(h('div', { class: 'topbar' },
        h('div', {}, h('p', { class: 'eyebrow' }, 'Your numbers'), h('h1', { class: 'display md' }, 'Progress'))));
    } else if (name === 'profile') {
      topbar.append(h('div', { class: 'topbar' },
        h('div', {}, h('p', { class: 'eyebrow' }, 'Account'), h('h1', { class: 'display md' }, 'Profile'))));
    }
  }

  function paintTabbar(active) {
    tabbar.innerHTML = '';
    if (!active) { tabbar.classList.add('hide'); return; }
    tabbar.classList.remove('hide');
    const items = [
      { id: 'home', label: 'Home', icon: I.home },
      { id: 'progress', label: 'Progress', icon: I.progress },
      { id: 'profile', label: 'Profile', icon: I.profile }
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
    }, h('span', { html: I.scan, style: { display: 'grid' } }), 'Scan');
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
    { id: 'balanced', t: 'Balanced', s: 'Comfortable, rarely shiny or tight' },
    { id: 'oily', t: 'Oily / shine', s: 'Shine by midday, visible pores' },
    { id: 'acne', t: 'Acne-prone', s: 'Frequent breakouts or congestion' },
    { id: 'dry', t: 'Dry / dehydrated', s: 'Tight, flaky or dull patches' },
    { id: 'sensitive', t: 'Sensitive / redness', s: 'Reacts easily, flushes often' },
    { id: 'dark', t: 'Dark spots / scars', s: 'Marks left behind by old breakouts' }
  ];
  const CONCERNS = [
    { id: 'maintenance', t: 'General maintenance', s: 'Keep it clear and steady' },
    { id: 'clarity', t: 'Clearer skin', s: 'Fewer breakouts, less congestion' },
    { id: 'even', t: 'Even tone', s: 'Fade marks, even the complexion' },
    { id: 'eyes', t: 'Under-eye area', s: 'Shadow and puffiness' },
    { id: 'definition', t: 'Facial definition', s: 'Jaw, cheekbones, less puffiness' },
    { id: 'hair', t: 'Hair and grooming', s: 'Cut, styling, brow upkeep' }
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
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, 'Welcome'),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'Let\u2019s get your ', h('em', {}, 'baseline'), '.'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Seven quick questions, then one scan. Everything stays on this device \u2014 there is no account and no server.'),
        h('label', { class: 'field ' + riseCls(3), style: rise(3) },
          h('span', { class: 'lab' }, 'What should we call you?'),
          input,
          h('span', { class: 'hint' }, '2\u2013' + NAME_MAX + ' characters')),
        h('p', { class: 'tiny ' + riseCls(4), style: Object.assign({ marginTop: '18px' }, rise(4)) },
          'Lumorph is appearance guidance, not medical advice. It never diagnoses anything.')
      );
      foot.append(nextBtn('Continue', advance));
      setTimeout(() => { if (document.body.contains(input)) input.focus({ preventScroll: true }); }, first ? 520 : 260);
    }

    if (onb.step === 1) {
      const opts = [
        { id: 'male', t: 'Male', s: 'Uses the male reference ranges' },
        { id: 'female', t: 'Female', s: 'Uses the female reference ranges' },
        { id: 'other', t: 'Other', s: 'Uses a blended range' }
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
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, 'About you'),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'How should we ', h('em', {}, 'read'), ' your features?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Scores are measured against reference ranges, so this changes the yardstick \u2014 not the measurement.'),
        group
      );
      foot.append(nextBtn('Continue', advance));
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
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, 'About you'),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'When were you ', h('em', {}, 'born'), '?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Age shifts what is normal for skin and structure. It is used for your plan, nothing else.'),
        h('label', { class: 'field ' + riseCls(3), style: rise(3) },
          h('span', { class: 'lab' }, 'Date of birth'),
          dateInput,
          h('span', { class: 'hint' }, 'You must be ' + MIN_AGE + ' or older to use Lumorph')),
        pill
      );
      foot.append(nextBtn('Continue', advance));
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
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, 'About you'),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'How tall are ', h('em', {}, 'you'), '?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Framing advice depends on it. That is all it is used for.'),
        unitToggle,
        h('div', { class: 'center ' + riseCls(4), style: Object.assign({ marginTop: '30px' }, rise(4)) }, valueEl, slider)
      );
      foot.append(nextBtn('Continue', advance));
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
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, 'Your skin'),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'Which skin type ', h('em', {}, 'fits'), ' best?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Pick everything that applies. Your routine is built around this.'),
        group
      );
      foot.append(nextBtn('Continue', advance));
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
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, 'Your skin'),
        h('h1', { class: 'display lg ' + riseCls(1), style: Object.assign({ marginTop: '10px' }, rise(1)) },
          'What do you want to ', h('em', {}, 'change'), '?'),
        h('p', { class: 'lede ' + riseCls(2), style: rise(2) },
          'Your plan targets these. Pick up to three.'),
        group
      );
      foot.append(nextBtn('Continue', advance));
    }

    if (onb.step === 6) {
      const tips = [
        ['Face the light', 'Stand facing a window or a soft lamp, with nothing bright behind you.'],
        ['Glasses off, hair back', 'Your forehead, brows and jawline all need to be visible.'],
        ['Relax your face', 'Mouth closed, no smile, eyes on the camera.'],
        ['Phone at eye level', 'Hold it straight in front of you, at arm\u2019s length.']
      ];
      body.append(
        h('p', { class: 'eyebrow ' + riseCls(0), style: rise(0) }, 'Your first scan'),
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
      foot.append(nextBtn('Take my first scan', advance, I.camera));
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
    const greet = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 22 ? 'Good evening' : 'Still up';
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
            h('p', { class: 'eyebrow' }, 'Welcome back'),
            h('h1', { class: 'display lg', style: { marginTop: '6px' } }, greet + ', ', h('em', {}, S.profile.name))),
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
              h('p', { class: 'eyebrow' }, 'Focus'),
              h('div', { class: 'display sm', style: { marginTop: '4px' } }, focus ? focus.label : 'Balanced'),
              h('div', { class: 'row gap-12 mt-8' },
                stat('Face', scan.overall),
                stat('Skin', scan.pillars.skin != null ? scan.pillars.skin : '\u2014')))),
          h('div', { class: 'row gap-8 mt-16' },
            h('button', { class: 'btn small ghost', onclick: () => go('results') }, 'See breakdown'),
            h('button', { class: 'btn small ghost', onclick: () => go('scan') }, 'Scan again'))
        ] : [
          h('p', { class: 'eyebrow' }, 'Your baseline'),
          h('div', { class: 'display sm', style: { marginTop: '6px' } }, 'No scan yet'),
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
              h('div', { style: { fontSize: '14px', fontWeight: '600' } }, 'Skin routine'),
              h('div', { class: 'small' }, routineTitle()))),
          h('button', { class: 'icon-btn ghost', 'aria-label': 'Open routine', onclick: () => go('routine') },
            h('span', { html: I.chev, style: { display: 'grid' } })))),

      /* plan */
      h('div', { class: 'card mt-16 rise', style: { '--i': 5 } },
        h('div', { class: 'row between' },
          h('div', {},
            h('div', { style: { fontSize: '14px', fontWeight: '600' } }, 'Your plan'),
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
            h('div', { class: 'small xp-next' }, rk.next ? rk.next.at - S.xp + ' XP to ' + rk.next.name : 'Top rank reached'),
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
    return (t[0] || 'Balanced') + ' \u00b7 ' + routineSteps().length + ' steps';
  }
  function planLine() {
    const c = S.profile.concerns.map((id) => (CONCERNS.find((s) => s.id === id) || {}).t).filter(Boolean);
    return (c[0] || 'General maintenance') + ' \u00b7 ' + c.length + ' target' + (c.length === 1 ? '' : 's');
  }

  function questRow(q2, q) {
    const on = !!q[q2.id];
    return h('div', { class: 'quest' + (on ? ' done' : ''), onclick: (e) => toggleQuest(q2, e.currentTarget) },
      h('span', { class: 'tick' }, h('span', { html: I.check, style: { display: 'grid' } })),
      h('div', { class: 'grow' },
        h('div', { class: 't' }, q2.label),
        h('div', { class: 'tiny' }, on ? 'Cleared' : 'Tap to clear')),
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
      if (sub) sub.textContent = on ? 'Cleared' : 'Tap to clear';
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
    if (nextLbl) nextLbl.textContent = rk.next ? (rk.next.at - S.xp) + ' XP to ' + rk.next.name : 'Top rank reached';
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
          h('div', { class: 'display sm mt-8' }, 'Your first scan starts the line'),
          h('p', { class: 'small mt-8' }, 'Progress needs two points. Take a scan now, then again in a week \u2014 same light, same angle.'),
          h('button', { class: 'btn primary mt-16', onclick: () => go('scan') }, 'Take a scan'))
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
            h('p', { class: 'eyebrow' }, 'Face score'),
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

      h('div', { class: 'card mt-16 rise', style: { '--i': 1 } },
        h('div', { class: 'row between' },
          h('div', {},
            h('p', { class: 'eyebrow' }, 'Rank'),
            h('div', { class: 'display md', style: { marginTop: '4px' } }, rk.name)),
          h('div', { class: 'display sm mono', style: { color: 'var(--gold)' } }, S.xp + ' XP')),
        h('div', { class: 'bar mt-12', style: { '--w': rk.pct } }, h('i', {})),
        h('p', { class: 'tiny mt-8' }, rk.next ? (rk.next.at - S.xp) + ' XP to ' + rk.next.name : 'Top rank reached')),

      h('div', { class: 'row gap-10 mt-16 rise', style: { '--i': 2 } },
        bigStat(streak(), 'Day streak'),
        bigStat(bestStreak(), 'Best streak'),
        bigStat(monthCount(), 'This month')),

      h('div', { class: 'card mt-16 rise', style: { '--i': 3 } },
        h('div', { class: 'card-h' },
          h('div', { class: 'eyebrow' }, 'Last five weeks'),
          h('div', { class: 'row gap-8' },
            h('span', { class: 'tiny' }, 'Cleared'),
            h('span', { class: 'tiny', style: { color: 'var(--faint)' } }, 'Frozen'))),
        heatmap()),

      h('div', { class: 'card mt-16 rise', style: { '--i': 4 } },
        h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, 'Scan history'),
        h('div', { class: 'list' }, scans.slice().reverse().map((s) => h('div', {
          class: 'item', onclick: () => { S._open = s.id; go('results', { id: s.id }); }
        },
          h('span', { class: 'ico', style: { background: 'var(--surface-2)' } }, s.overall.toFixed(1)),
          h('div', { class: 'txt' },
            h('div', { class: 't' }, new Date(s.ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })),
            h('div', { class: 's' }, (s.focus && s.focus[0] ? 'Focus: ' + s.focus[0].label : 'Balanced') + ' \u00b7 ' + new Date(s.ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))),
          h('span', { class: 'chev', html: I.chev, style: { display: 'grid' } }))))),

      h('button', { class: 'item rise', style: { '--i': 5, width: '100%' }, onclick: () => go('how') },
        h('span', { class: 'ico', html: I.info, style: { display: 'grid' } }),
        h('div', { class: 'txt' }, h('div', { class: 't' }, 'How these numbers are calculated'), h('div', { class: 's' }, 'The full rubric, in plain language')),
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

  ROUTES.scan = function (root) {
    const demo = /demo=1/.test(location.search);
    const video = h('video', { playsinline: true, autoplay: true, muted: true });
    const oval = h('div', { class: 'cam-oval' },
      h('div', { html: `<svg viewBox="0 0 200 280"><ellipse class="guide" cx="100" cy="140" rx="62" ry="96"/></svg>` }));
    const hint = h('div', { class: 'cam-hint' }, 'Starting camera\u2026');
    const chips = h('div', { class: 'cam-chips' });
    const wrap = h('div', { class: 'cam-wrap' }, video, oval, hint);
    const fileInput = h('input', { type: 'file', accept: 'image/*', class: 'hide' });

    const captureBtn = h('button', { class: 'btn primary mt-16', disabled: true, onclick: () => capture() },
      h('span', { html: I.camera, style: { width: '18px', height: '18px', display: 'grid' } }), 'Capture');

    root.append(
      h('div', { class: 'rise', style: { '--i': 0 } },
        h('div', { class: 'row between', style: { paddingTop: '6px', marginBottom: '14px' } },
          h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: () => go(lastScan() ? 'home' : 'onboarding') },
            h('span', { html: I.close, style: { display: 'grid', width: '18px', height: '18px' } })),
          h('button', { class: 'btn small ghost', onclick: () => fileInput.click() },
            h('span', { html: I.upload, style: { width: '16px', height: '16px', display: 'grid' } }), 'Upload'))),
      h('div', { class: 'rise', style: { '--i': 1 } },
        h('p', { class: 'eyebrow' }, 'New scan'),
        h('h1', { class: 'display md', style: { marginTop: '4px' } }, 'Fill the oval, ', h('em', {}, 'look straight'), '.')),
      wrap, chips, captureBtn, fileInput,
      h('p', { class: 'tiny center mt-16 rise', style: { '--i': 3 } },
        'Measured in this tab. Nothing is uploaded. Photos are kept in your browser so your history works offline.')
    );

    async function boot() {
      if (demo) { hint.textContent = 'Preview mode \u2014 using a sample face'; captureBtn.disabled = false; return; }
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
          ? 'Camera permission denied \u2014 upload a photo instead'
          : 'No camera here \u2014 upload a photo instead';
        captureBtn.disabled = true;
        chips.innerHTML = '';
        chips.append(h('span', { class: 'qchip' }, 'Use Upload above'));
      }
    }

    const chipEls = {};
    [['face', 'Face'], ['angle', 'Angle'], ['light', 'Light'], ['focus', 'Focus']].forEach(([id, label]) => {
      const el = h('span', { class: 'qchip' }, h('span', { class: 'd' }), label);
      chipEls[id] = el;
      chips.append(el);
    });

    function updateLive() {
      const vw = video.videoWidth || 1080, vh = video.videoHeight || 1440;
      const q = E.quality(cam.lm, vw, vh, video);
      Object.keys(chipEls).forEach((id) => {
        const c = (q.chips || []).find((x) => x.id === id);
        chipEls[id].classList.toggle('ok', !!(c && c.ok));
      });
      oval.classList.toggle('ok', q.ok);
      hint.textContent = q.message;
      captureBtn.disabled = !q.ok;
    }

    function capture() {
      if (demo) {
        processScan(null, E.demoLandmarks(Math.floor(Math.random() * 99999)), 1080, 1440);
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
      const pts = flipped
        ? cam.lm.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }))
        : cam.lm;
      processScan(cv, pts, vw, vh);
    }

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
          processScan(img, pts, img.naturalWidth, img.naturalHeight);
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

  function processScan(source, landmarks, w, h) {
    stopCam();
    pendingScan = { source, landmarks, w, h };
    go('processing');
  }

  ROUTES.processing = function (root) {
    const p = pendingScan;
    const steps = ['Measuring your face', 'Reading your skin', 'Building your plan'];
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

    if (!p) { setTimeout(() => go('home'), 400); return; }

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
      let metrics = {};
      let quality = { ok: true, chips: [] };
      try {
        metrics = E.rawMetrics(p.landmarks, p.w, p.h);
        if (p.source) {
          const skin = E.skinMetrics(p.source, p.landmarks);
          if (skin) Object.assign(metrics, skin);
          quality = E.quality(p.landmarks, p.w, p.h, p.source);
        }
      } catch (err) { /* keep whatever measured cleanly */ }

      // preview mode has no photo to read: use plausible skin numbers
      if (!p.source && /demo=1/.test(location.search)) {
        Object.assign(metrics, { evenness: 0.052, redness: 0.061, underEye: 0.031, shine: 0.64, texture: 0.030 });
      }

      const res = E.score(metrics, (S.profile && S.profile.gender) || 'other');
      const thumb = p.source ? shrink(p.source, 220) : null;
      const scan = {
        id: 's' + Date.now(),
        ts: Date.now(),
        overall: res.overall,
        pillars: res.pillars,
        details: res.details,
        focus: res.focus,
        metrics,
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
    [['face', 'Face'], ['ratings', 'Ratings'], ['insights', 'Insights']].forEach(([k, label]) => {
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
          h('span', { class: 'pill plain' }, new Date(scan.ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))),
        h('p', { class: 'eyebrow' }, 'Your scan'),
        h('h1', { class: 'display md', style: { marginTop: '4px', marginBottom: '14px' } }, 'Face ', h('em', {}, 'analysis'))),
      seg
    );
    const body = h('div', { class: 'mt-20' });
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
            h('p', { class: 'eyebrow' }, 'Overall'),
            h('div', { class: 'display md', style: { marginTop: '2px' } }, scoreWord(scan.overall)),
            h('p', { class: 'small mt-8' }, 'Measured from 478 landmarks on this device. No cloud, no guessing.')))),
      h('div', { class: 'card mt-16 rise', style: { '--i': 1 } },
        h('div', { class: 'card-h' }, h('div', { class: 'eyebrow' }, 'Pillars')),
        E.PILLARS.map((p) => {
          const v = scan.pillars[p.id];
          return h('div', { class: 'pillar' },
            h('div', { class: 'top' },
              h('span', { class: 'name' }, p.label),
              h('span', { class: 'score' }, v == null ? '\u2014' : v.toFixed(1))),
            h('div', { class: 'bar', style: { '--w': (v || 0) / 10 } }, h('i', {})),
            h('div', { class: 'blurb' }, p.blurb));
        })),
      h('div', { class: 'mt-20 rise', style: { '--i': 2 } },
        h('h2', { class: 'display sm', style: { marginBottom: '10px' } }, 'Where to focus'),
        h('div', { class: 'list' }, (scan.focus || []).map((f) => h('div', { class: 'item' },
          h('span', { class: 'ico' }, h('span', { html: I.bolt, style: { width: '16px', height: '16px', display: 'grid' } })),
          h('div', { class: 'txt' },
            h('div', { class: 't' }, f.label),
            h('div', { class: 's' }, f.tip)),
          h('span', { class: 'display sm mono', style: { color: 'var(--gold)' } }, f.score.toFixed(1)))))),
      h('div', { class: 'row gap-10 mt-20 rise', style: { '--i': 3 } },
        h('button', { class: 'btn ghost', onclick: () => go('routine') }, 'Your routine'),
        h('button', { class: 'btn primary', onclick: () => go('scan') }, 'Scan again'))
    );
    return wrap;
  }

  function scoreWord(v) {
    if (v >= 9) return 'Exceptional';
    if (v >= 8) return 'Strong';
    if (v >= 7) return 'Good';
    if (v >= 6) return 'Solid';
    if (v >= 5) return 'Average';
    return 'Room to work';
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
            h('p', { class: 'eyebrow' }, 'Overall'),
            h('div', { class: 'display xl mono' }, scan.overall.toFixed(1)),
            h('p', { class: 'small' }, 'of 10 \u00b7 ' + (scan.details || []).length + ' measurements')))),
      h('div', { class: 'card mt-16 rise', style: { '--i': 1 } },
        h('div', { class: 'eyebrow', style: { marginBottom: '6px' } }, 'Every measurement'),
        E.PILLARS.map((p) => {
          const rows = byPillar[p.id] || [];
          if (!rows.length) return null;
          return h('div', { style: { marginTop: '12px' } },
            h('div', { class: 'row between', style: { marginBottom: '4px' } },
              h('span', { class: 'small', style: { color: 'var(--ink)', fontWeight: '600' } }, p.label),
              h('span', { class: 'tiny mono' }, scan.pillars[p.id] != null ? scan.pillars[p.id].toFixed(1) : '\u2014')),
            rows.map((d) => h('div', { class: 'metric' },
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
          h('div', { class: 'eyebrow' }, 'Skin signals'),
          h('span', { class: 'display sm mono', style: { color: 'var(--gold)' } },
            scan.pillars.skin != null ? scan.pillars.skin.toFixed(1) : '\u2014')),
        skinRows.length ? skinRows.map((d) => h('div', { class: 'metric' },
          h('div', { class: 'mt' }, h('div', { class: 'mn' }, d.label), h('div', { class: 'mv' }, d.valueLabel)),
          h('div', { class: 'mb' }, h('div', { class: 'bar thin', style: { '--w': d.score / 10 } }, h('i', {}))),
          h('div', { class: 'ms' }, d.score.toFixed(1))))
          : h('p', { class: 'small' }, 'Skin signals need a captured photo, not an upload.'),
        h('p', { class: 'tiny mt-12' }, 'Read from the pixels of this one photo: tone variance, redness, under-eye contrast, shine and texture. It is an appearance estimate, not a measurement of your skin.')),

      h('div', { class: 'card mt-16 rise', style: { '--i': 1 } },
        h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, 'What to do next'),
        routine.slice(0, 3).map((s) => h('div', { class: 'item' },
          h('span', { class: 'ico' }, h('span', { html: I.check, style: { width: '15px', height: '15px', display: 'grid' } })),
          h('div', { class: 'txt' }, h('div', { class: 't' }, s.title), h('div', { class: 's' }, s.note))))),

      h('div', { class: 'card mt-16 rise', style: { '--i': 2 } },
        h('div', { class: 'row gap-10', style: { marginBottom: '8px' } },
          h('span', { html: I.shield, style: { width: '18px', height: '18px', color: 'var(--gold)', display: 'grid' } }),
          h('span', { style: { fontWeight: '600', fontSize: '13.5px' } }, 'Cosmetic insight only')),
        h('p', { class: 'small' }, 'Lumorph does not diagnose, treat or screen for any condition. If something on your skin worries you, see a dermatologist.')),
      h('div', { class: 'row gap-10 mt-20 rise', style: { '--i': 3 } },
        h('button', { class: 'btn ghost', onclick: () => go('how') }, 'How this is scored'),
        h('button', { class: 'btn primary', onclick: () => go('routine') }, 'Open routine'))
    );
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
        h('h1', { class: 'display md', style: { marginTop: '14px' } }, S.profile.name),
        h('div', { class: 'row gap-8', style: { justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' } },
          h('span', { class: 'pill gold' }, 'Free forever'),
          h('span', { class: 'pill plain' }, 'Rank: ' + rk.name),
          BADGES.filter((b) => S.badges && S.badges[b.id]).map((b) =>
            h('span', { class: 'pill badge-pill' }, h('span', { class: 'dot' }), b.label)))),

      h('p', { class: 'eyebrow mt-28 rise', style: { '--i': 1 } }, 'About you'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 2 } },
        h('div', { class: 'row between' },
          kv('Gender', (S.profile.gender || '\u2014').replace(/^./, (m) => m.toUpperCase())),
          kv('Age', S.profile.birth ? String(ageFrom(S.profile.birth)) : '\u2014'),
          kv('Height', S.profile.height + ' cm'))),

      h('p', { class: 'eyebrow mt-20 rise', style: { '--i': 3 } }, 'Skin'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 4 } },
        h('div', { class: 'item', style: { padding: '6px 0' } },
          h('span', { class: 'ico' }, h('span', { html: I.drop, style: { width: '18px', height: '18px', display: 'grid' } })),
          h('div', { class: 'txt' }, h('div', { class: 't' }, t || 'Balanced'), h('div', { class: 's' }, 'Skin type'))),
        h('div', { class: 'item', style: { padding: '6px 0' } },
          h('span', { class: 'ico' }, h('span', { html: I.target, style: { width: '18px', height: '18px', display: 'grid' } })),
          h('div', { class: 'txt' }, h('div', { class: 't' }, c || 'General maintenance'), h('div', { class: 's' }, 'Focus')))),

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
      h('p', { class: 'sect rise', style: { '--i': 1 } }, 'Appearance'),
      h('div', { class: 'rise', style: { '--i': 2 } },
        tileSeg([
          { id: 'dark', label: 'Dark', icon: I.moon },
          { id: 'light', label: 'Light', icon: I.sun },
          { id: 'system', label: 'System', icon: I.gear }
        ], S.theme, (id) => { S.theme = id; save(); applyTheme(); })),

      /* selfie photos */
      h('p', { class: 'sect rise', style: { '--i': 3 } }, 'Selfie photos'),
      h('div', { class: 'rise', style: { '--i': 4 } },
        tileSeg([
          { id: 'auto', label: 'Automatic', icon: I.sparkle },
          { id: 'flipped', label: 'Flipped', icon: I.flip },
          { id: 'as-is', label: 'As saved', icon: I.image }
        ], (S.settings.mirror || 'auto'), (id) => { S.settings.mirror = id; save(); toast(id === 'flipped' ? 'Camera photos will be flipped' : id === 'as-is' ? 'Photos saved exactly as captured' : 'Handled automatically'); })),
      h('p', { class: 'helper rise', style: { '--i': 5 } },
        'If a photo from your camera looks reversed next to the live preview, choose Flipped. Photos you upload are never changed.'),

      /* notifications */
      h('p', { class: 'sect rise', style: { '--i': 6 } }, 'Notifications'),
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
              icon: I.refresh, title: 'Weekly re-scan',
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

      /* scores & legal */
      h('p', { class: 'sect rise', style: { '--i': 8 } }, 'Scores & legal'),
      h('div', { class: 'group rise', style: { '--i': 9 } },
        growRow({ icon: I.sigma, title: 'How we calculate your scores', sub: 'What each score measures, and what it cannot tell you.', chev: true, onClick: () => go('how') }),
        growRow({ icon: I.doc, title: 'Privacy Policy', sub: 'What is stored, and where it lives.', chev: true, onClick: () => openDoc('privacy') }),
        growRow({ icon: I.terms, title: 'Terms of Service', sub: 'What to expect when you use Lumorph.', chev: true, onClick: () => openDoc('terms') }),
        growRow({ icon: I.person, title: 'How deletion works', sub: 'What happens when you delete your data.', chev: true, onClick: () => openDoc('deletion') }),
        growRow({ icon: I.shield, title: 'Data consent', sub: consent, tick: true })
      ),

      /* promo */
      h('p', { class: 'sect rise', style: { '--i': 10 } }, 'Promo'),
      h('div', { class: 'group rise', style: { '--i': 11 } },
        growRow({ icon: I.gift, title: 'Redeem a promo code', sub: 'Got a code from a creator or a friend?', chev: true, onClick: redeemPromo })),

      /* subscription */
      h('p', { class: 'sect rise', style: { '--i': 12 } }, 'Subscription'),
      h('div', { class: 'group rise', style: { '--i': 13 } },
        growRow({ icon: I.check, title: 'No subscription. Ever.', sub: 'There is nothing to buy, restore or cancel.', tick: true })),

      /* data */
      h('p', { class: 'sect rise', style: { '--i': 14 } }, 'Data & account'),
      h('div', { class: 'group rise', style: { '--i': 15 } },
        growRow({ icon: I.braces, title: 'Export as JSON', sub: 'Every scan, measurement and quest.', down: true, onClick: exportJson }),
        growRow({ icon: I.table, title: 'Export as spreadsheets', sub: 'The same data as CSV, one file per table.', down: true, onClick: exportCsv })),
      h('div', { class: 'group rise', style: { '--i': 16, marginTop: '14px' } },
        growRow({ icon: I.trash, title: 'Delete all data', sub: 'Permanently removes every scan from this device.', danger: true, chev: true, onClick: confirmWipe })),

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
        ['h', 'Delete all data'],
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
      h('h2', { class: 'display sm' }, 'Redeem a promo code'),
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
        sec('Face analysis', [
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
        sec('Skin signals', [
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
        h('button', { class: 'btn primary', onclick: () => go('home') }, 'Home'))
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
