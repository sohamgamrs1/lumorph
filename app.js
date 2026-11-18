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
  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l4.5-5 3.5 3 3-4.5L20 14"/><circle cx="18.5" cy="6" r="1.6"/></svg>',
    profile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c1-3.6 3.8-5.4 7.2-5.4s6.2 1.8 7.2 5.4"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><circle cx="12" cy="12" r="3.2"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5.2 5L20 6.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h2.5L8 6h8l1.5 2.5H20v10H4z"/><circle cx="12" cy="13" r="3.2"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z"/><path d="M18.5 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/></svg>',
    drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.5c3.2 4 5.5 6.6 5.5 9.4A5.5 5.5 0 0 1 12 18.4a5.5 5.5 0 0 1-5.5-5.5c0-2.8 2.3-5.4 5.5-9.4z"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/></svg>',
    water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 12.5h12l-1.2 7a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M9 12.5V7a3 3 0 0 1 6 0v5.5"/></svg>',
    posture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.2"/><path d="M12 8v7M8 20l4-5 4 5M6.5 11h11"/></svg>',
    comb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h14v5H5z"/><path d="M7 9v11M11 9v11M15 9v11M19 9v11"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1 19.8 7"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l7 2.5v6c0 4.4-3 7.6-7 9.5-4-1.9-7-5.1-7-9.5v-6z"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12"/><path d="M7.5 11.5 12 16l4.5-4.5"/><path d="M4 20h16"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 8h.01"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/></svg>'
  };

  /* ---------------- store ---------------- */
  const KEY = 'lumorph.v2';
  const RANKS = [
    { name: 'Newbie', at: 0 }, { name: 'Grinder', at: 500 }, { name: 'Sharp', at: 1500 },
    { name: 'Polished', at: 3500 }, { name: 'Luminous', at: 7000 }, { name: 'Apex', at: 12000 }
  ];
  const QUESTS = [
    { id: 'am', label: 'Morning skincare', xp: 20, icon: 'drop' },
    { id: 'pm', label: 'Night skincare', xp: 20, icon: 'moon' },
    { id: 'sleep', label: 'Sleep 7+ hours', xp: 15, icon: 'moon' },
    { id: 'water', label: 'Drink 2L water', xp: 10, icon: 'water' },
    { id: 'posture', label: 'Posture check', xp: 10, icon: 'posture' },
    { id: 'groom', label: 'Grooming', xp: 10, icon: 'comb' }
  ];
  const WEEKLY = { id: 'rescan', label: 'Weekly re-scan', xp: 100, icon: 'refresh' };

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
      const done = Object.values(q).filter(Boolean).length;
      if (done >= 1) { n++; d.setDate(d.getDate() - 1); }
      else if (i === 0) { d.setDate(d.getDate() - 1); }
      else break;
    }
    return n;
  }
  function bestStreak() {
    const keys = Object.keys(S.quests).filter((k) => Object.values(S.quests[k]).some(Boolean)).sort();
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
    if (reduced()) { el.textContent = dp === 0 ? Math.round(to) : to.toFixed(dp); return; }
    const start = performance.now();
    function frame(t) {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * e;
      el.textContent = dp === 0 ? Math.round(v) : v.toFixed(dp);
      if (p < 1) raf(frame);
    }
    raf(frame);
  }
  function animateRing(circle, pct, opts) {
    const o = opts || {};
    const r = parseFloat(circle.getAttribute('r'));
    const c = 2 * Math.PI * r;
    if (reduced()) {
      circle.style.strokeDasharray = c;
      circle.style.strokeDashoffset = c * (1 - pct);
      return;
    }
    circle.style.strokeDasharray = c;
    circle.style.strokeDashoffset = c;
    const dur = o.dur || 1100;
    const start = performance.now();
    const to = c * (1 - pct);
    function frame(t) {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      circle.style.strokeDashoffset = c - (c - to) * e;
      if (p < 1) raf(frame);
    }
    raf(frame);
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
    reveal(view);
    fillBars(view);
  }
  window.addEventListener('popstate', (e) => {
    const name = (e.state && e.state.r) || (location.hash || '').replace('#/', '') || 'home';
    if (name !== route) go(name, { fromHistory: true });
  });

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

    raf(() => {
      const btn = inner.querySelector('button.active');
      if (!btn) { glow.style.width = '0px'; glow.style.opacity = '0'; return; }
      glow.style.opacity = '1';
      glow.style.width = btn.offsetWidth - 8 + 'px';
      glow.style.transform = `translate3d(${btn.offsetLeft + 4}px,0,0)`;
    });
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
  ROUTES.onboarding = function () {
    onb = onb || {
      step: 0,
      name: (S.profile && S.profile.name) || '',
      gender: (S.profile && S.profile.gender) || '',
      birth: (S.profile && S.profile.birth) || '',
      height: (S.profile && S.profile.height) || 175,
      unit: 'cm',
      skin: (S.profile && S.profile.skin) || [],
      concerns: (S.profile && S.profile.concerns) || []
    };
    renderOnb();
  };

  function renderOnb() {
    view.innerHTML = '';
    topbar.innerHTML = '';
    const steps = 7;
    const pct = (onb.step + 1) / steps;
    const body = h('div', { class: 'body' });
    const foot = h('div', { class: 'foot' });

    const back = h('button', { class: 'icon-btn ghost', 'aria-label': 'Back', onclick: () => {
      if (onb.step === 0) return;
      onb.step--; renderOnb();
    } }, h('span', { html: I.back, style: { display: 'grid', width: '20px', height: '20px' } }));

    const wrap = h('div', { class: 'onb' },
      h('div', { class: 'row gap-12', style: { alignItems: 'center' } }, back,
        h('div', { class: 'steps', style: { flex: '1' } },
          Array.from({ length: steps }, (_, i) => h('i', { class: i <= onb.step ? (i === onb.step ? 'now' : 'done') : '' })))),
      body, foot
    );

    const next = (fn) => h('button', { class: 'btn primary', onclick: fn }, 'Continue');

    if (onb.step === 0) {
      body.append(
        h('div', { class: 'rise', style: { '--i': 0 } }, h('p', { class: 'eyebrow' }, 'Welcome')),
        h('h1', { class: 'display lg rise', style: { '--i': 1, marginTop: '10px' } }, 'Let\u2019s get your ', h('em', {}, 'baseline'), '.'),
        h('p', { class: 'lede rise', style: { '--i': 2 } }, 'Seven quick questions, then one scan. Everything stays on this device \u2014 there is no account and no server.'),
        h('label', { class: 'field rise', style: { '--i': 3 } },
          h('span', { class: 'lab' }, 'What should we call you?'),
          h('input', {
            class: 'input', type: 'text', placeholder: 'Your first name', value: onb.name,
            oninput: (e) => { onb.name = e.target.value; }
          })),
        h('p', { class: 'tiny rise', style: { '--i': 4, marginTop: '18px' } },
          'Lumorph is appearance guidance, not medical advice. It never diagnoses anything.')
      );
      foot.append(next(() => { onb.step = 1; renderOnb(); }));
    }

    if (onb.step === 1) {
      const opts = [
        { id: 'male', t: 'Male', s: 'Uses the male reference ranges' },
        { id: 'female', t: 'Female', s: 'Uses the female reference ranges' },
        { id: 'other', t: 'Other', s: 'Uses a blended range' }
      ];
      body.append(
        h('p', { class: 'eyebrow rise', style: { '--i': 0 } }, 'About you'),
        h('h1', { class: 'display lg rise', style: { '--i': 1, marginTop: '10px' } }, 'How should we ', h('em', {}, 'read'), ' your features?'),
        h('p', { class: 'lede rise', style: { '--i': 2 } }, 'Scores are measured against reference ranges, so this changes the yardstick \u2014 not the measurement.'),
        h('div', { class: 'choices one mt-20' }, opts.map((o, i) => h('button', {
          class: 'choice rise', style: { '--i': 3 + i }, 'aria-pressed': String(onb.gender === o.id),
          onclick: () => { onb.gender = o.id; renderOnb(); }
        }, h('span', { class: 'check' }, h('span', { html: I.check, style: { display: 'grid' } })),
           h('span', { class: 't' }, o.t), h('span', { class: 's' }, o.s))))
      );
      foot.append(next(() => { onb.step = 2; renderOnb(); }));
    }

    if (onb.step === 2) {
      body.append(
        h('p', { class: 'eyebrow rise', style: { '--i': 0 } }, 'About you'),
        h('h1', { class: 'display lg rise', style: { '--i': 1, marginTop: '10px' } }, 'When were you ', h('em', {}, 'born'), '?'),
        h('p', { class: 'lede rise', style: { '--i': 2 } }, 'Age shifts what is normal for skin and structure. It is used for your plan, nothing else.'),
        h('label', { class: 'field rise', style: { '--i': 3 } },
          h('span', { class: 'lab' }, 'Date of birth'),
          h('input', {
            class: 'input', type: 'date', value: onb.birth, max: todayKey(),
            onchange: (e) => { onb.birth = e.target.value; renderOnb(); }
          })),
        onb.birth ? h('p', { class: 'pill gold rise', style: { '--i': 4, marginTop: '14px' } }, 'Age ' + ageFrom(onb.birth)) : null
      );
      foot.append(next(() => { onb.step = 3; renderOnb(); }));
    }

    if (onb.step === 3) {
      const hh = onb.unit === 'cm' ? onb.height : Math.round(onb.height / 2.54);
      body.append(
        h('p', { class: 'eyebrow rise', style: { '--i': 0 } }, 'About you'),
        h('h1', { class: 'display lg rise', style: { '--i': 1, marginTop: '10px' } }, 'How tall are ', h('em', {}, 'you'), '?'),
        h('p', { class: 'lede rise', style: { '--i': 2 } }, 'Framing advice depends on it. That is all it is used for.'),
        h('div', { class: 'segmented no-thumb mt-20 rise', style: { '--i': 3, maxWidth: '220px' } },
          ['cm', 'ft'].map((u) => h('button', {
            'aria-selected': String(onb.unit === u),
            onclick: () => { onb.unit = u; renderOnb(); }
          }, u === 'cm' ? 'Centimetres' : 'Feet'))),
        h('div', { class: 'center rise', style: { '--i': 4, marginTop: '34px' } },
          h('div', { class: 'display xl mono' }, String(hh), h('span', { class: 'small', style: { marginLeft: '8px' } }, onb.unit === 'cm' ? 'cm' : 'in')),
          h('input', {
            type: 'range', min: onb.unit === 'cm' ? 140 : 55, max: onb.unit === 'cm' ? 210 : 83,
            value: hh, style: { width: '100%', marginTop: '22px', accentColor: 'var(--gold)' },
            oninput: (e) => {
              const v = Number(e.target.value);
              onb.height = onb.unit === 'cm' ? v : Math.round(v * 2.54);
              $('.display.xl', body).firstChild.textContent = String(v);
            }
          }))
      );
      foot.append(next(() => { onb.step = 4; renderOnb(); }));
    }

    if (onb.step === 4) {
      body.append(
        h('p', { class: 'eyebrow rise', style: { '--i': 0 } }, 'Your skin'),
        h('h1', { class: 'display lg rise', style: { '--i': 1, marginTop: '10px' } }, 'Which skin type ', h('em', {}, 'fits'), ' best?'),
        h('p', { class: 'lede rise', style: { '--i': 2 } }, 'Pick everything that applies. Your routine is built around this.'),
        h('div', { class: 'choices mt-20' }, SKIN_TYPES.map((o, i) => h('button', {
          class: 'choice rise', style: { '--i': 3 + i * 0.5 }, 'aria-pressed': String(onb.skin.includes(o.id)),
          onclick: () => {
            onb.skin = onb.skin.includes(o.id) ? onb.skin.filter((x) => x !== o.id) : [...onb.skin, o.id];
            renderOnb();
          }
        }, h('span', { class: 'check' }, h('span', { html: I.check, style: { display: 'grid' } })),
           h('span', { class: 't' }, o.t), h('span', { class: 's' }, o.s))))
      );
      foot.append(next(() => { onb.step = 5; renderOnb(); }));
    }

    if (onb.step === 5) {
      body.append(
        h('p', { class: 'eyebrow rise', style: { '--i': 0 } }, 'Your skin'),
        h('h1', { class: 'display lg rise', style: { '--i': 1, marginTop: '10px' } }, 'What do you want to ', h('em', {}, 'change'), '?'),
        h('p', { class: 'lede rise', style: { '--i': 2 } }, 'Your plan targets these. Pick up to three.'),
        h('div', { class: 'choices mt-20' }, CONCERNS.map((o, i) => h('button', {
          class: 'choice rise', style: { '--i': 3 + i * 0.5 }, 'aria-pressed': String(onb.concerns.includes(o.id)),
          onclick: () => {
            if (!onb.concerns.includes(o.id) && onb.concerns.length >= 3) { toast('Three targets is plenty'); return; }
            onb.concerns = onb.concerns.includes(o.id) ? onb.concerns.filter((x) => x !== o.id) : [...onb.concerns, o.id];
            renderOnb();
          }
        }, h('span', { class: 'check' }, h('span', { html: I.check, style: { display: 'grid' } })),
           h('span', { class: 't' }, o.t), h('span', { class: 's' }, o.s))))
      );
      foot.append(next(() => { onb.step = 6; renderOnb(); }));
    }

    if (onb.step === 6) {
      const tips = [
        ['Face the light', 'Stand facing a window or a soft lamp, with nothing bright behind you.'],
        ['Glasses off, hair back', 'Your forehead, brows and jawline all need to be visible.'],
        ['Relax your face', 'Mouth closed, no smile, eyes on the camera.'],
        ['Phone at eye level', 'Hold it straight in front of you, at arm\u2019s length.']
      ];
      body.append(
        h('p', { class: 'eyebrow rise', style: { '--i': 0 } }, 'Your first scan'),
        h('h1', { class: 'display lg rise', style: { '--i': 1, marginTop: '10px' } }, 'How to take a ', h('em', {}, 'good'), ' scan'),
        h('p', { class: 'lede rise', style: { '--i': 2 } }, 'This scan is the baseline every later scan is compared with.'),
        h('div', { class: 'card mt-20 rise', style: { '--i': 3 } },
          tips.map((t, i) => h('div', { class: 'row gap-12', style: { padding: '11px 0', borderTop: i ? '1px solid var(--line)' : 'none' } },
            h('div', { class: 'pill gold', style: { width: '26px', height: '26px', padding: '0', justifyContent: 'center', flex: '0 0 auto' } }, String(i + 1)),
            h('div', {}, h('div', { style: { fontSize: '13.5px', fontWeight: '600' } }, t[0]),
              h('div', { class: 'small' }, t[1]))))),
        h('div', { class: 'card mt-16 rise', style: { '--i': 4 } },
          h('div', { class: 'row gap-10', style: { marginBottom: '8px' } },
            h('span', { html: I.shield, style: { width: '18px', height: '18px', color: 'var(--gold)', display: 'grid' } }),
            h('span', { style: { fontSize: '13.5px', fontWeight: '600' } }, 'Where your photo goes')),
          h('p', { class: 'small' }, 'Nowhere. The scan runs in this browser tab, the measurements never leave the device, and the photo is kept in this browser\u2019s own storage so you can see your history. No upload, no account, no third party.')),
      );
      foot.append(h('button', {
        class: 'btn primary',
        onclick: () => {
          S.profile = {
            name: (onb.name || 'Friend').trim().slice(0, 24),
            gender: onb.gender || 'other',
            birth: onb.birth || '',
            height: onb.height || 175,
            skin: onb.skin.length ? onb.skin : ['balanced'],
            concerns: onb.concerns.length ? onb.concerns : ['maintenance']
          };
          S.onboarded = true;
          S.consent = { type: 'local-analysis', at: Date.now() };
          save();
          go('scan');
        }
      }, h('span', { html: I.camera, style: { width: '18px', height: '18px', display: 'grid' } }), 'Take my first scan'));
    }

    view.append(wrap);
    reveal(view);
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
        done: Object.values(qq).some(Boolean),
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

      h('p', { class: 'small mt-12 rise', style: { '--i': 2 } },
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
          h('div', { class: 'small' }, done + '/6')),
        h('div', {}, QUESTS.map((q2) => questRow(q2, q))),
        h('div', { class: 'row between mt-16', style: { paddingTop: '14px', borderTop: '1px solid var(--line)' } },
          h('div', {},
            h('div', { class: 'small' }, rk.next ? rk.next.at - S.xp + ' XP to ' + rk.next.name : 'Top rank reached'),
            h('div', { class: 'bar thin mt-8', style: { width: '150px', '--w': rk.pct } }, h('i', {}))),
          h('div', { class: 'display sm mono' }, String(S.xp) + ' XP')),

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
    return h('div', { class: 'quest' + (on ? ' done' : ''), onclick: () => toggleQuest(q2) },
      h('span', { class: 'tick' }, h('span', { html: I.check, style: { display: 'grid' } })),
      h('div', { class: 'grow' },
        h('div', { class: 't' }, q2.label),
        h('div', { class: 'tiny' }, on ? 'Cleared' : 'Tap to clear')),
      h('span', { class: 'xp' }, '+' + q2.xp));
  }

  function toggleQuest(q2) {
    const q = dayQuests();
    const on = !q[q2.id];
    q[q2.id] = on;
    S.xp = Math.max(0, S.xp + (on ? q2.xp : -q2.xp));
    const done = QUESTS.filter((x) => q[x.id]).length;
    if (done === 4 && !q._bonus) { q._bonus = true; S.xp += 25; toast('Four cleared \u2014 +25 bonus XP'); }
    else if (done < 4 && q._bonus) { q._bonus = false; S.xp -= 25; }
    else if (on) toast('+' + q2.xp + ' XP');
    save();
    haptic(on ? 10 : 6);
    go('home');
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
      return d.getMonth() === m && Object.values(S.quests[k]).some(Boolean);
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
      const done = Object.values(q).filter(Boolean).length;
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

    function updateLive() {
      const vw = video.videoWidth || 1080, vh = video.videoHeight || 1440;
      const q = E.quality(cam.lm, vw, vh);
      chips.innerHTML = '';
      q.chips.forEach((c) => chips.append(h('span', { class: 'qchip' + (c.ok ? ' ok' : '') },
        h('span', { class: 'd' }), c.label)));
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
      const cv = document.createElement('canvas');
      cv.width = vw; cv.height = vh;
      const ctx = cv.getContext('2d');
      ctx.drawImage(video, 0, 0, vw, vh);
      processScan(cv, cam.lm, vw, vh);
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
      if (S.scans.length > 60) S.scans.shift();
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
        h('div', { class: 'list' }, scan.focus.map((f) => h('div', { class: 'item' },
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
        h('div', { class: 'row gap-8', style: { justifyContent: 'center', marginTop: '10px' } },
          h('span', { class: 'pill gold' }, 'Free forever'),
          h('span', { class: 'pill plain' }, 'Rank: ' + rk.name))),

      h('p', { class: 'eyebrow mt-28 rise', style: { '--i': 1 } }, 'About you'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 2 } },
        h('div', { class: 'row between' },
          kv('Gender', (S.profile.gender || '\u2014').replace(/^./, (m) => m.toUpperCase())),
          kv('Age', S.profile.birth ? String(ageFrom(S.profile.birth)) : '\u2014'),
          kv('Height', S.profile.height + ' cm'))),

      h('p', { class: 'eyebrow mt-20 rise', style: { '--i': 3 } }, 'Skin'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 4 } },
        h('div', { class: 'item', style: { padding: '6px 0' } },
          h('span', { class: 'ico' }, h('span', { html: I.drop, style: { width: '16px', height: '16px', display: 'grid' } })),
          h('div', { class: 'txt' }, h('div', { class: 't' }, t || 'Balanced'), h('div', { class: 's' }, 'Skin type'))),
        h('div', { class: 'item', style: { padding: '6px 0' } },
          h('span', { class: 'ico' }, h('span', { html: I.sparkle, style: { width: '16px', height: '16px', display: 'grid' } })),
          h('div', { class: 'txt' }, h('div', { class: 't' }, c || 'General maintenance'), h('div', { class: 's' }, 'Focus')))),

      h('p', { class: 'eyebrow mt-20 rise', style: { '--i': 5 } }, 'Account'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 6 } },
        linkRow('Edit name', 'Change what the app calls you', I.gear, () => editName()),
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
  ROUTES.settings = function (root) {
    const themes = [['dark', 'Dark', I.moon], ['light', 'Light', I.sun], ['system', 'System', I.gear]];
    root.append(
      h('div', { class: 'rise', style: { '--i': 0 } },
        h('div', { class: 'row', style: { paddingTop: '6px', marginBottom: '14px' } },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => go('profile') },
            h('span', { html: I.back, style: { display: 'grid', width: '18px', height: '18px' } }))),
        h('p', { class: 'eyebrow' }, 'Lumorph'),
        h('h1', { class: 'display lg', style: { marginTop: '6px' } }, 'Settings & ', h('em', {}, 'privacy'))),

      h('p', { class: 'eyebrow mt-28 rise', style: { '--i': 1 } }, 'Appearance'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 2 } },
        h('div', { class: 'segmented no-thumb' }, themes.map(([id, label, icon]) =>
          h('button', {
            'aria-selected': String(S.theme === id),
            onclick: () => { S.theme = id; save(); applyTheme(); go('settings'); }
          }, label)))),

      h('p', { class: 'eyebrow mt-20 rise', style: { '--i': 3 } }, 'Data & account'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 4 } },
        linkRow('Export everything as JSON', 'Every scan, measurement and quest', I.download, exportData),
        linkRow('Delete all data', 'Wipes this browser clean', I.trash, confirmWipe)),

      h('p', { class: 'eyebrow mt-20 rise', style: { '--i': 5 } }, 'About'),
      h('div', { class: 'card mt-12 rise', style: { '--i': 6 } },
        linkRow('How scores work', 'The rubric and its limits', I.info, () => go('how')),
        linkRow('Privacy', 'What is stored and where', I.shield, () => openSheet(privacySheet()))),
      h('p', { class: 'tiny center mt-20 rise', style: { '--i': 7 } }, 'Lumorph v1 \u00b7 free, offline, no accounts')
    );
  };

  function privacySheet() {
    return h('div', {},
      h('h2', { class: 'display sm' }, 'Privacy'),
      h('p', { class: 'small mt-12' }, 'Lumorph has no server. Your photos, measurements, quests and scores are stored in this browser\u2019s local storage on this device. Nothing is uploaded, transmitted, sold or shared, because there is nowhere for it to go.'),
      h('p', { class: 'small mt-12' }, 'Clearing your browser data, or using Delete all data, removes everything permanently. Export first if you want a copy.'),
      h('p', { class: 'small mt-12' }, 'Face detection runs through MediaPipe, downloaded once from a public CDN and executed locally. Face recognition and face classification are not used \u2014 only landmark positions.'),
      h('button', { class: 'btn primary mt-20', onclick: closeSheet }, 'Got it'));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'lumorph-export-' + todayKey() + '.json' });
    document.body.append(a); a.click(); a.remove();
    toast('Exported');
  }
  function confirmWipe() {
    openSheet(h('div', {},
      h('h2', { class: 'display sm' }, 'Delete everything?'),
      h('p', { class: 'small mt-12' }, 'This removes every scan, photo and quest from this browser. It cannot be undone.'),
      h('div', { class: 'row gap-10 mt-20' },
        h('button', { class: 'btn ghost', onclick: closeSheet }, 'Keep it'),
        h('button', { class: 'btn danger', onclick: () => {
          localStorage.removeItem(KEY);
          S = blank();
          closeSheet();
          onb = null;
          go('onboarding');
          toast('Everything deleted');
        } }, 'Delete'))));
  }

  /* ---------- how scores work ---------- */
  ROUTES.how = function (root) {
    root.append(
      h('div', { class: 'rise', style: { '--i': 0 } },
        h('div', { class: 'row', style: { paddingTop: '6px', marginBottom: '14px' } },
          h('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: () => go('profile') },
            h('span', { html: I.back, style: { display: 'grid', width: '18px', height: '18px' } }))),
        h('p', { class: 'eyebrow' }, 'Transparency'),
        h('h1', { class: 'display lg', style: { marginTop: '6px' } }, 'How we calculate ', h('em', {}, 'your scores')),
        h('p', { class: 'lede' }, 'No black box. Here is every input, every weight, and what the number cannot tell you.')),

      h('div', { class: 'card mt-20 rise', style: { '--i': 1 } },
        h('div', { class: 'eyebrow' }, 'The pipeline'),
        [
          ['Landmarks', 'MediaPipe finds 478 points on your face, on this device. The points are never uploaded.'],
          ['Measurements', 'Those points become 22 ratios and angles: symmetry, thirds, jaw width, canthal tilt, lip ratios and so on.'],
          ['Scoring', 'Each measurement scores 10 inside its ideal band and falls away smoothly outside it. No cliffs, no randomness.'],
          ['Pillars', 'Measurements average into five pillars, then into one overall score out of ten.'],
          ['Skin', 'Five appearance signals read from the pixels of the photo itself: tone variance, redness, under-eye contrast, shine, texture.']
        ].map(([t, s], i) => h('div', { class: 'row gap-12', style: { padding: '12px 0', borderTop: i ? '1px solid var(--line)' : 'none' } },
          h('div', { class: 'pill gold', style: { width: '26px', height: '26px', padding: '0', justifyContent: 'center', flex: '0 0 auto' } }, String(i + 1)),
          h('div', {}, h('div', { style: { fontSize: '14px', fontWeight: '600' } }, t), h('div', { class: 'small' }, s))))),

      h('div', { class: 'card mt-16 rise', style: { '--i': 2 } },
        h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, 'Weights'),
        E.PILLARS.map((p) => h('div', { class: 'row between', style: { padding: '9px 0', borderTop: '1px solid var(--line)' } },
          h('div', {}, h('div', { style: { fontSize: '13.5px', fontWeight: '600' } }, p.label), h('div', { class: 'tiny' }, p.blurb)),
          h('span', { class: 'display sm mono', style: { color: 'var(--gold)' } }, Math.round(p.weight * 100) + '%')))),

      h('div', { class: 'card mt-16 rise', style: { '--i': 3 } },
        h('div', { class: 'row gap-10', style: { marginBottom: '8px' } },
          h('span', { html: I.shield, style: { width: '18px', height: '18px', color: 'var(--gold)', display: 'grid' } }),
          h('span', { style: { fontWeight: '600', fontSize: '13.5px' } }, 'What this is not')),
        h('p', { class: 'small' }, 'It is not a measurement of attractiveness, and it is not a medical device. It reads geometry from one photo in one moment. Light, lens, angle and expression all move the number. Use it as a trend line against your own past scans, never as a verdict.'),
        h('p', { class: 'small mt-12' }, 'It does not diagnose, treat or screen for any condition, and it must not be used to check for acne, moles or anything else. See a dermatologist for that.')),

      h('button', { class: 'btn ghost mt-20 rise', style: { '--i': 4 }, onclick: () => go('home') }, 'Back to home')
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

  /* ---------------- demo seed ---------------- */
  function seedDemo() {
    S = blank();
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

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
