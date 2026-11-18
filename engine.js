/* ============================================================
   Lumorph — scoring engine
   Deterministic. On-device. No network, no AI, no cost.

   Input : 478 MediaPipe Face Landmarker points (normalised 0..1)
   Output: pillar scores, sub-metric scores, focus list, quality
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- landmark index constants (canonical MediaPipe mesh) ---------- */
  const L = {
    forehead: 10, chin: 152, nasion: 168, bridge: 6, noseTip: 1, subnasale: 4,
    alaR: 98, alaL: 327,
    faceR: 234, faceL: 454, templeR: 127, templeL: 356,
    gonionR: 172, gonionL: 397, jawR: 132, jawL: 361,
    cheekR: 58, cheekL: 288,
    eyeOutR: 33, eyeInR: 133, eyeInL: 362, eyeOutL: 263,
    lidUpR: 159, lidLoR: 145, lidUpL: 386, lidLoL: 374,
    browPeakR: 105, browPeakL: 334, browOutR: 70, browOutL: 300,
    mouthR: 61, mouthL: 291,
    lipTop: 0, lipUpIn: 13, lipLoIn: 14, lipBottom: 17,
    foreheadMid: 9
  };

  /* ---------- small maths ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const deg = (r) => (r * 180) / Math.PI;

  function smootherstep(t) {
    t = clamp(t, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /* A metric scores 10 inside its ideal band and falls away smoothly
     outside it. No cliffs: two nearby measurements give nearby scores. */
  function band(value, lo, hi, falloff) {
    if (value >= lo && value <= hi) return 10;
    const d = value < lo ? lo - value : value - hi;
    const t = d / Math.max(falloff, 1e-6);
    return 10 * (1 - smootherstep(t));
  }

  function round1(v) { return Math.round(v * 10) / 10; }

  /* ---------- geometry helpers (work in pixels) ---------- */
  function makeGeo(lm, w, h) {
    const p = (i) => ({ x: lm[i].x * w, y: lm[i].y * h, z: (lm[i].z || 0) * w });
    const P = {};
    for (const k in L) P[k] = p(L[k]);

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    const eyeMid = { x: (P.eyeOutR.x + P.eyeInR.x + P.eyeInL.x + P.eyeOutL.x) / 4,
                     y: (P.eyeOutR.y + P.eyeInR.y + P.eyeInL.y + P.eyeOutL.y) / 4 };

    // unit vector along the eye line (left -> right in image space)
    const ex = P.eyeOutL.x - P.eyeOutR.x, ey = P.eyeOutL.y - P.eyeOutR.y;
    const elen = Math.hypot(ex, ey) || 1;
    const along = { x: ex / elen, y: ey / elen };            // toward image-left
    const across = { x: -along.y, y: along.x };              // perpendicular (downward)

    const ipd = dist(P.eyeOutR, P.eyeOutL) || 1;
    const faceW = dist(P.faceR, P.faceL) || 1;
    const faceH = dist(P.forehead, P.chin) || 1;

    // signed lateral offset from the facial midline (pixels, + = image left side)
    const lateral = (pt) => {
      const vx = pt.x - eyeMid.x, vy = pt.y - eyeMid.y;
      return vx * along.x + vy * along.y;
    };
    // signed vertical offset along the face axis (+ = toward chin)
    const vertical = (pt) => {
      const vx = pt.x - eyeMid.x, vy = pt.y - eyeMid.y;
      return vx * across.x + vy * across.y;
    };

    const angleAt = (a, b, c) => {
      const v1 = { x: a.x - b.x, y: a.y - b.y }, v2 = { x: c.x - b.x, y: c.y - b.y };
      const dot = v1.x * v2.x + v1.y * v2.y;
      const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1;
      return deg(Math.acos(clamp(dot / m, -1, 1)));
    };

    const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    return { P, dist, ipd, faceW, faceH, lateral, vertical, angleAt, mid, eyeMid, along, across };
  }

  /* ---------- raw metrics ---------- */
  function rawMetrics(lm, w, h) {
    const g = makeGeo(lm, w, h);
    const { P, dist, ipd, faceW, faceH, lateral, vertical, angleAt } = g;

    /* 1. symmetry — mirrored pairs should sit equally far from the midline */
    const pairs = [
      [P.eyeOutR, P.eyeOutL], [P.eyeInR, P.eyeInL], [P.mouthR, P.mouthL],
      [P.gonionR, P.gonionL], [P.faceR, P.faceL], [P.cheekR, P.cheekL],
      [P.templeR, P.templeL], [P.browPeakR, P.browPeakL], [P.browOutR, P.browOutL],
      [P.jawR, P.jawL], [P.alaR, P.alaL], [P.lidUpR, P.lidUpL], [P.lidLoR, P.lidLoL]
    ];
    let symSum = 0;
    pairs.forEach(([a, b]) => { symSum += Math.abs(Math.abs(lateral(a)) - Math.abs(lateral(b))); });
    const symmetry = symSum / pairs.length / ipd;

    /* 2. facial thirds */
    const upper = Math.abs(vertical(P.nasion) - vertical(P.forehead));
    const middle = Math.abs(vertical(P.subnasale) - vertical(P.nasion));
    const lower = Math.abs(vertical(P.chin) - vertical(P.subnasale));
    const total = upper + middle + lower || 1;
    const thirds = [upper / total, middle / total, lower / total];
    const thirdsDev = Math.max(...thirds.map((t) => Math.abs(t - 1 / 3)));

    /* 3. facial fifths — the eye band divided into five equal columns */
    const fifth = faceW / 5;
    const eyeOuterW = Math.abs(lateral(P.eyeOutL) - lateral(P.eyeOutR));
    const gap = Math.abs(lateral(P.eyeInL) - lateral(P.eyeInR));
    const fifthsDev = Math.max(
      Math.abs(gap - fifth) / faceW,
      Math.abs((eyeOuterW - gap) / 2 - fifth) / faceW,
      Math.abs((faceW - eyeOuterW) / 2 - fifth) / faceW
    );

    /* 4. proportions */
    const ipdRatio = ipd / faceW;
    const midfaceRatio = ipd / (Math.abs(vertical(P.subnasale) - vertical(P.nasion)) || 1);

    /* 5. eyes */
    const tiltR = deg(Math.atan2(-(P.eyeOutR.y - P.eyeInR.y), Math.abs(P.eyeOutR.x - P.eyeInR.x)));
    const tiltL = deg(Math.atan2(-(P.eyeOutL.y - P.eyeInL.y), Math.abs(P.eyeOutL.x - P.eyeInL.x)));
    const canthalTilt = (tiltR + tiltL) / 2;
    const eyeWR = dist(P.eyeInR, P.eyeOutR) || 1;
    const eyeWL = dist(P.eyeInL, P.eyeOutL) || 1;
    const eyeHR = dist(P.lidUpR, P.lidLoR);
    const eyeHL = dist(P.lidUpL, P.lidLoL);
    const eyeAspect = ((eyeHR / eyeWR) + (eyeHL / eyeWL)) / 2;

    /* 6. nose and lips */
    const noseW = dist(P.alaR, P.alaL) || 1;
    const intercanthal = gap || 1;
    const noseToEyeGap = noseW / intercanthal;
    const philtrum = Math.abs(vertical(P.lipTop) - vertical(P.subnasale));
    const chinH = Math.abs(vertical(P.chin) - vertical(P.lipLoIn));
    const philtrumChin = philtrum / (philtrum + chinH || 1);
    const lipW = dist(P.mouthR, P.mouthL) || 1;
    const lipToNose = lipW / noseW;
    const upperVerm = Math.abs(vertical(P.lipUpIn) - vertical(P.lipTop));
    const lowerVerm = Math.abs(vertical(P.lipBottom) - vertical(P.lipLoIn));
    const vermilionRatio = upperVerm / (lowerVerm || 1);
    const lipFullness = (upperVerm + lowerVerm) / lipW;

    /* 7. jaw and cheek structure */
    const bigonial = dist(P.gonionR, P.gonionL);
    const jawCheek = bigonial / faceW;
    const gonialR = angleAt(P.faceR, P.gonionR, P.chin);
    const gonialL = angleAt(P.faceL, P.gonionL, P.chin);
    const gonialAngle = (gonialR + gonialL) / 2;
    const chinWidth = dist(P.jawR, P.jawL) / faceW;

    /* 8. dimorphism cues */
    const eyeY = (P.lidUpR.y + P.lidUpL.y) / 2;
    const browHeight = (eyeY - (P.browPeakR.y + P.browPeakL.y) / 2) / ipd;
    const midfaceWidth = dist(P.cheekR, P.cheekL) / faceW;

    return {
      symmetry, thirdsDev, fifthsDev, ipdRatio, midfaceRatio, canthalTilt,
      eyeAspect, noseToEyeGap, philtrumChin, lipToNose, vermilionRatio,
      lipFullness, jawCheek, gonialAngle, chinWidth, browHeight, midfaceWidth,
      thirds, _geo: { faceW, faceH, ipd, eyeMid: g.eyeMid }
    };
  }

  /* ---------- skin signals, straight off the pixels ---------- */
  function skinMetrics(img, lm) {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const S = 220; // work small, it is a texture measurement not a print
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = Math.round((S * h) / w);
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    const data = ctx.getImageData(0, 0, cv.width, cv.height).data;

    const px = (i) => ({ x: lm[i].x * cv.width, y: lm[i].y * cv.height });
    const g = makeGeo(lm, cv.width, cv.height);

    function patch(center, radius) {
      const out = [];
      const r = Math.max(2, Math.round(radius));
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y > r * r) continue;
          const X = Math.round(center.x + x), Y = Math.round(center.y + y);
          if (X < 0 || Y < 0 || X >= cv.width || Y >= cv.height) continue;
          const o = (Y * cv.width + X) * 4;
          out.push([data[o] / 255, data[o + 1] / 255, data[o + 2] / 255]);
        }
      }
      return out;
    }

    const lum = ([r, gg, b]) => 0.2126 * r + 0.7152 * gg + 0.0722 * b;
    const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
    const std = (a) => {
      const m = mean(a);
      return Math.sqrt(mean(a.map((v) => (v - m) * (v - m))));
    };

    const faceW = g.faceW;
    const rad = faceW * 0.055;

    const cheekR = patch(px(L.cheekR), rad);
    const cheekL = patch(px(L.cheekL), rad);
    const forehead = patch(px(L.foreheadMid), rad);
    const underR = patch(g.mid(px(L.lidLoR), px(L.cheekR)), rad * 0.8);
    const underL = patch(g.mid(px(L.lidLoL), px(L.cheekL)), rad * 0.8);
    const tzone = patch(g.mid(px(L.nasion), px(L.noseTip)), rad * 0.7);

    const all = [...cheekR, ...cheekL, ...forehead];
    if (!all.length) return null;

    const redness = mean(all.map(([r, gg]) => r - gg));
    const evenness = std(all.map(lum));
    const cheekLum = mean([...cheekR, ...cheekL].map(lum));
    const underLum = mean([...underR, ...underL].map(lum));
    const underEye = clamp(cheekLum - underLum, -0.2, 0.4);

    const tzLum = tzone.map(lum).sort((a, b) => a - b);
    const p95 = tzLum.length ? tzLum[Math.floor(tzLum.length * 0.95)] : 0.7;
    const shine = p95;

    // high-frequency energy across the cheeks: a proxy for visible texture
    let energy = 0, n = 0;
    for (const c of [px(L.cheekR), px(L.cheekL)]) {
      const r = Math.round(rad * 1.4);
      for (let y = -r; y < r; y += 2) {
        for (let x = -r; x < r; x += 2) {
          const X = Math.round(c.x + x), Y = Math.round(c.y + y);
          if (X < 1 || Y < 1 || X >= cv.width - 1 || Y >= cv.height - 1) continue;
          const o = (Y * cv.width + X) * 4;
          const oR = (Y * cv.width + X + 1) * 4;
          const oD = ((Y + 1) * cv.width + X) * 4;
          const l0 = lum([data[o] / 255, data[o + 1] / 255, data[o + 2] / 255]);
          const l1 = lum([data[oR] / 255, data[oR + 1] / 255, data[oR + 2] / 255]);
          const l2 = lum([data[oD] / 255, data[oD + 1] / 255, data[oD + 2] / 255]);
          energy += Math.abs(l1 - l0) + Math.abs(l2 - l0);
          n++;
        }
      }
    }
    const texture = n ? energy / n : 0.04;

    return { redness, evenness, underEye, shine, texture };
  }

  /* ---------- lighting normalisation ----------
     A photo taken in a dim room should not score as worse skin than the same
     face by a window. Before the skin signals are read, exposure is pulled
     toward a target and contrast is gently flattened, so the numbers track
     the face rather than the lamp. */
  function normalise(img, target) {
    const w = img.naturalWidth || img.videoWidth || img.width;
    const h = img.naturalHeight || img.videoHeight || img.height;
    if (!w || !h) return img;

    const S = 320;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = Math.round((S * h) / w);
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cv.width, cv.height);

    let data;
    try { data = ctx.getImageData(0, 0, cv.width, cv.height); } catch (e) { return img; }
    const px = data.data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) {
      sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    }
    const mean = (sum / (px.length / 4)) / 255;
    const want = target == null ? 0.56 : target;
    if (mean < 0.02) return img;

    // gain toward the target, damped so a badly lit photo is corrected, not invented
    const gain = Math.min(1.85, Math.max(0.62, want / mean));
    const gamma = mean < want ? 0.92 : 1.06;

    for (let i = 0; i < px.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = px[i + c] / 255;
        v = Math.pow(v, gamma) * gain;
        px[i + c] = Math.max(0, Math.min(255, v * 255));
      }
    }
    ctx.putImageData(data, 0, 0);
    return cv;
  }

  /* ---------- side profile (beta) ----------
     Read from the side photo. Approximate by nature: a face mesh sees a true
     profile only roughly, so this is scored on its own and never added to the
     overall number. */
  function sideMetrics(lm, w, h) {
    if (!lm || !lm.length) return null;
    const g = makeGeo(lm, w, h);
    const { P, dist, faceH, angleAt } = g;

    // how far the chin sits behind or ahead of the brow, along the face axis
    const chinDrop = Math.abs(g.vertical(P.chin) - g.vertical(P.nasion));
    const chinProj = (g.vertical(P.chin) - g.vertical(P.nasion)) / (chinDrop || 1);

    // profile convexity: brow -> subnasale -> chin
    const convex = angleAt(P.nasion, P.subnasale, P.chin);

    // rough side gonial: gonion -> chin against gonion -> ear line
    const gonial = angleAt(P.gonionR, P.chin, P.faceR);

    return {
      chinProjection: convex,
      jawline: gonial,
      harmony: 180 - Math.abs(convex - 165) * 1.4
    };
  }

  /* ---------- landmarks on the wire ----------
     Stored as integers 0-999 so a scan can be redrawn later without keeping
     a second copy of the photo. */
  function encodeLandmarks(lm) {
    if (!lm) return '';
    let out = '';
    for (let i = 0; i < lm.length; i++) {
      const x = Math.round(lm[i].x * 999);
      const y = Math.round(lm[i].y * 999);
      out += (i ? ';' : '') + x + ',' + y;
    }
    return out;
  }
  function decodeLandmarks(str) {
    if (!str) return null;
    return str.split(';').map((p) => {
      const [x, y] = p.split(',');
      return { x: Number(x) / 999, y: Number(y) / 999, z: 0 };
    });
  }

  /* which points a measurement is drawn from */
  const METRIC_POINTS = {
    symmetry: [33, 263],
    thirdsDev: [10, 168, 4, 152],
    fifthsDev: [234, 33, 133, 362, 263, 454],
    ipdRatio: [33, 263, 234, 454],
    midfaceRatio: [133, 362, 168, 4],
    jawCheek: [172, 397, 234, 454],
    gonialAngle: [234, 172, 152],
    chinWidth: [132, 361],
    browHeight: [105, 334, 159, 386],
    lipFullness: [0, 13, 14, 17],
    midfaceWidth: [58, 288, 234, 454],
    canthalTilt: [133, 33, 362, 263],
    eyeAspect: [159, 145, 386, 374],
    noseToEyeGap: [98, 327, 133, 362],
    philtrumChin: [4, 0, 152],
    lipToNose: [61, 291, 98, 327],
    vermilionRatio: [0, 13, 14, 17],
    evenness: [58, 288, 9],
    redness: [58, 288],
    underEye: [145, 374, 58, 288],
    shine: [168, 1],
    texture: [58, 288]
  };

  /* ---------- the rubric ---------- */
  /* Bands are the first calibration pass. Every number here is meant to be
     tuned against real photos; nothing is hidden from the user. */
  function genderBands(gender) {
    const male = gender === 'male';
    return {
      jawCheek: male ? [0.82, 0.93] : [0.72, 0.85],
      gonial: male ? [116, 136] : [120, 140],
      browHeight: male ? [0.30, 0.44] : [0.34, 0.50],
      lipFullness: male ? [0.22, 0.34] : [0.28, 0.44],
      midfaceWidth: male ? [0.62, 0.80] : [0.60, 0.78]
    };
  }

  const METRICS = [
    { id: 'symmetry', label: 'Symmetry', pillar: 'harmony', fmt: (v) => (v * 100).toFixed(1) + '%',
      score: (v) => band(v, 0, 0.012, 0.085), tip: 'Asymmetry is mostly light and camera angle. Shoot straight-on, at eye level, in even light.' },
    { id: 'thirdsDev', label: 'Facial thirds', pillar: 'harmony', fmt: (v) => (v * 100).toFixed(1) + '% dev',
      score: (v) => band(v, 0, 0.02, 0.055), tip: 'Thirds shift with head tilt. A level chin is worth more than any product.' },
    { id: 'fifthsDev', label: 'Facial fifths', pillar: 'harmony', fmt: (v) => (v * 100).toFixed(1) + '% dev',
      score: (v) => band(v, 0, 0.045, 0.08), tip: 'Width balance is fixed structure. What you control is hair volume at the sides.' },
    { id: 'ipdRatio', label: 'Eye spacing', pillar: 'harmony', fmt: (v) => v.toFixed(3),
      score: (v) => band(v, 0.43, 0.49, 0.07), tip: 'Fixed. Frames and brow shape change how this reads more than anything else.' },
    { id: 'midfaceRatio', label: 'Midface ratio', pillar: 'harmony', fmt: (v) => v.toFixed(2),
      score: (v) => band(v, 0.94, 1.16, 0.34), tip: 'Hairline and brow shape change the perceived midface more than the midface changes.' },

    { id: 'jawCheek', label: 'Jaw to cheek width', pillar: 'angularity', fmt: (v) => v.toFixed(2),
      score: (v, b) => band(v, b.jawCheek[0], b.jawCheek[1], 0.12), tip: 'Body fat and neck posture move this more than any mewing myth. Train, sleep, stand tall.' },
    { id: 'gonialAngle', label: 'Gonial angle', pillar: 'angularity', fmt: (v) => v.toFixed(0) + '\u00b0',
      score: (v, b) => band(v, b.gonial[0], b.gonial[1], 14), tip: 'Partly fixed. Chewing hard food and keeping your tongue on the palate is the honest advice.' },
    { id: 'chinWidth', label: 'Chin width', pillar: 'angularity', fmt: (v) => v.toFixed(2),
      score: (v) => band(v, 0.16, 0.27, 0.08), tip: 'Facial hair is the fastest lever here: a defined chin line reads wider immediately.' },

    { id: 'browHeight', label: 'Brow prominence', pillar: 'dimorphism', fmt: (v) => v.toFixed(2),
      score: (v, b) => band(v, b.browHeight[0], b.browHeight[1], 0.14), tip: 'Brow grooming changes this in minutes. Keep the natural line, clean the strays.' },
    { id: 'lipFullness', label: 'Lip fullness', pillar: 'dimorphism', fmt: (v) => v.toFixed(2),
      score: (v, b) => band(v, b.lipFullness[0], b.lipFullness[1], 0.14), tip: 'Hydration and a lip balm with SPF do more than any product marketed at you.' },
    { id: 'midfaceWidth', label: 'Cheekbone width', pillar: 'dimorphism', fmt: (v) => v.toFixed(2),
      score: (v, b) => band(v, b.midfaceWidth[0], b.midfaceWidth[1], 0.14), tip: 'Cheekbone definition follows body composition. Leaner face, more visible bone.' },

    { id: 'canthalTilt', label: 'Canthal tilt', pillar: 'features', fmt: (v) => v.toFixed(1) + '\u00b0',
      score: (v) => band(v, 1.5, 9, 8), tip: 'Fixed anatomy. Sleep and hydration decide whether your eyes look tired or awake.' },
    { id: 'eyeAspect', label: 'Eye aperture', pillar: 'features', fmt: (v) => v.toFixed(2),
      score: (v) => band(v, 0.27, 0.42, 0.14), tip: 'Under-eye puffiness closes the aperture. Cold, sleep, and less salt all show up here.' },
    { id: 'noseToEyeGap', label: 'Nose width to eye gap', pillar: 'features', fmt: (v) => v.toFixed(2),
      score: (v) => band(v, 0.85, 1.10, 0.32), tip: 'Fixed. Keep the nose clean and the skin calm and it reads narrower.' },
    { id: 'philtrumChin', label: 'Philtrum to chin', pillar: 'features', fmt: (v) => v.toFixed(2),
      score: (v) => band(v, 0.30, 0.36, 0.09), tip: 'Posture and lip posture change how the lower third sits. Closed mouth, jaw relaxed.' },
    { id: 'lipToNose', label: 'Mouth to nose width', pillar: 'features', fmt: (v) => v.toFixed(2),
      score: (v) => band(v, 1.45, 1.85, 0.42), tip: 'Fixed. Smiling evenly is free and always scores better in photos.' },
    { id: 'vermilionRatio', label: 'Upper to lower lip', pillar: 'features', fmt: (v) => v.toFixed(2),
      score: (v) => band(v, 0.52, 0.86, 0.32), tip: 'Hydration first. Chapped lips read as thin lips.' },

    { id: 'evenness', label: 'Tone evenness', pillar: 'skin', fmt: (v) => (v * 100).toFixed(0) + '% var',
      score: (v) => band(v, 0, 0.055, 0.10), tip: 'SPF every morning is the single highest-return step for even tone.' },
    { id: 'redness', label: 'Redness', pillar: 'skin', fmt: (v) => (v * 100).toFixed(0) + '%',
      score: (v) => band(v, 0.01, 0.10, 0.11), tip: 'Gentle cleanser, no scrubbing, and a barrier moisturiser at night.' },
    { id: 'underEye', label: 'Under-eye shadow', pillar: 'skin', fmt: (v) => (v * 100).toFixed(0) + '%',
      score: (v) => band(v, 0, 0.06, 0.12), tip: 'Sleep is the product. Eight hours beats every under-eye cream on the shelf.' },
    { id: 'shine', label: 'T-zone shine', pillar: 'skin', fmt: (v) => (v * 100).toFixed(0) + '%',
      score: (v) => band(v, 0.50, 0.86, 0.28), tip: 'A light gel moisturiser and blotting beats washing your face five times a day.' },
    { id: 'texture', label: 'Texture', pillar: 'skin', fmt: (v) => v.toFixed(3),
      score: (v) => band(v, 0, 0.045, 0.075), tip: 'Consistency over intensity: a simple routine done for 60 days beats a complicated one done twice.' }
  ];

  const PILLARS = [
    { id: 'harmony', label: 'Harmony', weight: 0.30, blurb: 'How the parts sit together: symmetry, thirds, fifths, spacing.' },
    { id: 'angularity', label: 'Angularity', weight: 0.20, blurb: 'Jaw and chin structure: width, angle, taper.' },
    { id: 'dimorphism', label: 'Dimorphism', weight: 0.15, blurb: 'How strongly your features read as your stated gender.' },
    { id: 'features', label: 'Features', weight: 0.25, blurb: 'Eyes, nose and mouth: tilt, aperture, ratios.' },
    { id: 'skin', label: 'Skin signals', weight: 0.10, blurb: 'Appearance only, read from this photo. Not a measurement.' }
  ];

  /* ---------- the score ---------- */
  function score(metrics, gender) {
    const bands = genderBands(gender);
    const details = [];
    const pillarScores = {};

    METRICS.forEach((m) => {
      const v = metrics[m.id];
      if (v == null || !isFinite(v)) return;
      const s = clamp(m.score(v, bands), 0, 10);
      details.push({
        id: m.id, label: m.label, pillar: m.pillar, value: v,
        valueLabel: m.fmt(v), score: s, tip: m.tip
      });
      (pillarScores[m.pillar] = pillarScores[m.pillar] || []).push(s);
    });

    const pillars = {};
    PILLARS.forEach((p) => {
      const arr = pillarScores[p.id] || [];
      pillars[p.id] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    });

    let total = 0, wsum = 0;
    PILLARS.forEach((p) => {
      if (pillars[p.id] == null) return;
      total += pillars[p.id] * p.weight;
      wsum += p.weight;
    });
    const overall = wsum ? total / wsum : 0;

    const focus = details
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    return {
      overall: round1(overall),
      pillars: Object.fromEntries(Object.entries(pillars).map(([k, v]) => [k, v == null ? null : round1(v)])),
      details,
      focus
    };
  }

  /* ---------- capture quality gates ---------- */
  function quality(lm, w, h, img) {
    if (!lm || !lm.length) {
      return { ok: false, chips: [{ id: 'face', label: 'Face', ok: false }], message: 'No face found. Move closer and fill the oval.' };
    }
    const g = makeGeo(lm, w, h);
    const { P } = g;

    // yaw: nose tip should sit near the eye midpoint laterally
    const yaw = Math.abs(g.lateral(P.noseTip) - g.lateral(g.eyeMid)) / g.ipd;
    // roll: the eye line should be close to level
    const roll = Math.abs(deg(Math.atan2(P.eyeOutL.y - P.eyeOutR.y, P.eyeOutL.x - P.eyeOutR.x)));

    let brightness = 0.6, sharpness = 0.05;
    if (img) {
      const S = 160;
      const cv = document.createElement('canvas');
      cv.width = S; cv.height = Math.round((S * h) / w);
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let sum = 0, e = 0, n = 0;
      for (let y = 1; y < cv.height - 1; y += 2) {
        for (let x = 1; x < cv.width - 1; x += 2) {
          const o = (y * cv.width + x) * 4;
          const l = (0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]) / 255;
          const oR = (y * cv.width + x + 1) * 4;
          const lR = (0.2126 * d[oR] + 0.7152 * d[oR + 1] + 0.0722 * d[oR + 2]) / 255;
          sum += l; e += Math.abs(lR - l); n++;
        }
      }
      brightness = sum / (n || 1);
      sharpness = e / (n || 1);
    }

    const chips = [
      { id: 'face', label: 'Face', ok: true },
      { id: 'angle', label: 'Angle', ok: yaw < 0.075 && roll < 7 },
      { id: 'light', label: 'Light', ok: brightness > 0.22 && brightness < 0.92 },
      { id: 'focus', label: 'Focus', ok: sharpness > 0.012 }
    ];

    const ok = chips.every((c) => c.ok);
    let message = 'Hold still \u2014 capturing.';
    if (!chips[1].ok) message = roll >= 7 ? 'Level your head.' : 'Turn to face the camera.';
    else if (!chips[2].ok) message = brightness <= 0.22 ? 'Face a light source.' : 'Too bright behind you.';
    else if (!chips[3].ok) message = 'Hold steady \u2014 the frame is soft.';

    return { ok, chips, message, yaw, roll, brightness, sharpness };
  }

  /* ---------- demo landmarks (for previews, and for the offline fallback) ---------- */
  function demoLandmarks(seed) {
    let s = seed || 1;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const j = (v, amt) => v + (rnd() - 0.5) * amt;

    const lm = new Array(478).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0 }));
    const W = 1000, H = 1333;
    const cx = j(500, 10), ey = j(600, 10);
    // shape variation so different seeds give genuinely different faces
    const faceHalf = 118 * (1 + (rnd() - 0.5) * 0.07);
    const jawHalf = 105 * (1 + (rnd() - 0.5) * 0.16);
    const eyeSpan = 55 * (1 + (rnd() - 0.5) * 0.10);
    const tilt = (rnd() - 0.5) * 9;
    const lipHalf = 33 * (1 + (rnd() - 0.5) * 0.22);
    const chinHalf = 30 * (1 + (rnd() - 0.5) * 0.18);
    const browDrop = 34 + (rnd() - 0.5) * 10;
    const set = (i, x, y) => { lm[i] = { x: x / W, y: y / H, z: 0 }; };

    set(10, cx, ey - 138);            // forehead (trichion)
    set(9, cx, ey - 112);             // forehead centre
    set(168, cx, ey - 42);            // nasion
    set(6, cx, ey - 80);              // bridge
    set(1, cx, ey + 46);              // nose tip
    set(4, cx, ey + 66);              // subnasale
    set(98, cx - 18, ey + 52);        // ala right
    set(327, cx + 18, ey + 52);       // ala left
    set(234, cx - faceHalf, ey);      // face edge right
    set(454, cx + faceHalf, ey);      // face edge left
    set(127, cx - faceHalf * 0.95, ey - 62);
    set(356, cx + faceHalf * 0.95, ey - 62);
    set(58, cx - faceHalf * 0.76, ey + 30);   // cheek right
    set(288, cx + faceHalf * 0.76, ey + 30);  // cheek left
    set(172, cx - jawHalf, ey + 90);         // gonion right
    set(397, cx + jawHalf, ey + 90);         // gonion left
    set(132, cx - chinHalf, ey + 140);
    set(361, cx + chinHalf, ey + 140);
    set(152, cx, ey + 166);           // chin
    set(33, cx - eyeSpan, ey - 3 - tilt);    // eye outer right
    set(133, cx - 18, ey + 2 + tilt * 0.4);  // eye inner right
    set(362, cx + 18, ey + 2 + tilt * 0.4);  // eye inner left
    set(263, cx + eyeSpan, ey - 3 - tilt);   // eye outer left
    set(159, cx - 36, ey - 6); set(145, cx - 36, ey + 6);
    set(386, cx + 36, ey - 6); set(374, cx + 36, ey + 6);
    set(105, cx - 40, ey - browDrop); set(334, cx + 40, ey - browDrop);
    set(70, cx - 62, ey - browDrop + 6); set(300, cx + 62, ey - browDrop + 6);
    set(61, cx - lipHalf, ey + 95);          // mouth corner right
    set(291, cx + lipHalf, ey + 95);         // mouth corner left
    set(0, cx, ey + 89);
    set(13, cx, ey + 96);
    set(14, cx, ey + 107);
    set(17, cx, ey + 115);

    for (let i = 0; i < 478; i++) {
      if (lm[i].x === 0.5 && lm[i].y === 0.5) {
        lm[i] = { x: 0.5 + (rnd() - 0.5) * 0.14, y: 0.45 + (rnd() - 0.5) * 0.30, z: 0 };
      }
    }
    return lm;
  }

  /* ---------- public ---------- */
  global.LumorphEngine = {
    METRICS, PILLARS, L, METRIC_POINTS,
    rawMetrics, skinMetrics, score, quality, demoLandmarks,
    normalise, sideMetrics, encodeLandmarks, decodeLandmarks,
    band, makeGeo
  };
})(window);
