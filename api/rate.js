/* POST /api/rate
   Holds the Gemini key server-side and returns a calibrated read of one photo.

   The key lives in the Vercel environment as GEMINI_KEY. It is never sent to
   the browser, never logged, and never returned in a response. */

/* Google retires model names regularly, so nothing here is hardcoded for long:
   we try a shortlist, and if all of it is gone we ask the API what it offers.
   The winner is cached for the life of the warm instance. */
const CONFIGURED = (process.env.GEMINI_MODEL || '').trim();
const ALIAS = 'gemini-flash-latest';
let cachedModel = null;
const MAX_BYTES = 2.5 * 1024 * 1024;
const MAX_B64 = Math.ceil(MAX_BYTES * 1.37);
const MIN_BYTES = 1024;

/* Layered limiter. Memory lives inside one warm serverless instance, so this
   bounds what any single instance can be made to spend, not the fleet. A
   distributed attacker needs shared state (Upstash, Vercel KV) to stop for
   real - see SECURITY.md. What this does stop: one person or one script
   hammering the key, and a runaway client loop. */
const LIMITS = { ipMinute: 6, ipHour: 30, globalHour: 300 };
const ipHits = new Map();
const globalHits = [];

function prune(list, cutoff) {
  while (list.length && list[0] < cutoff) list.shift();
}

function checkRate(ip) {
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  const hourAgo = now - 60 * 60 * 1000;

  prune(globalHits, hourAgo);
  if (globalHits.length >= LIMITS.globalHour) {
    return { ok: false, retry: Math.ceil((globalHits[0] + 3600000 - now) / 1000), scope: 'service' };
  }

  const mine = ipHits.get(ip) || [];
  prune(mine, hourAgo);
  ipHits.set(ip, mine);

  const lastMinute = mine.filter((t) => t > minuteAgo).length;
  if (lastMinute >= LIMITS.ipMinute) {
    const oldest = mine.filter((t) => t > minuteAgo)[0];
    return { ok: false, retry: Math.max(1, Math.ceil((oldest + 60000 - now) / 1000)), scope: 'device' };
  }
  if (mine.length >= LIMITS.ipHour) {
    return { ok: false, retry: Math.max(1, Math.ceil((mine[0] + 3600000 - now) / 1000)), scope: 'device' };
  }

  mine.push(now);
  globalHits.push(now);

  // keep the map from growing without bound
  if (ipHits.size > 5000) {
    const oldest = ipHits.keys().next().value;
    ipHits.delete(oldest);
  }
  return { ok: true };
}

/* every failure carries a sentence, never a bare code */
function fail(res, status, code, message, extra) {
  res.status(status).json(Object.assign({ ok: false, error: code, message }, extra || {}));
}

const SCHEMA = {
  type: 'object',
  properties: {
    face_found: { type: 'boolean' },
    attractiveness: { type: 'number' },
    harmony: { type: 'number' },
    skin: { type: 'number' },
    tier: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } }
  },
  required: ['face_found', 'attractiveness', 'harmony', 'skin', 'tier', 'strengths', 'improvements']
};

const PROMPT = `You are scoring a single photograph for a looksmaxxing app called Lumorph.

Score ONLY what is visible in this photo. Use this scale, which the app uses too:
  0-2   very far below average
  2-3   below average
  3-4   low tier (LTN / LTB)
  4-5   mid tier (MTN / MTB)
  5-7   high tier (HTN / HTB)
  7-8   very attractive (Chad Lite / Stacy Lite)
  8-9   model-tier (Chad / Stacy)
  9-10  exceptional (True Adam / True Stacy)

Rules:
- Be consistent and calibrated. A normal, pleasant-looking person is 5. An
  unusually attractive person is 7. Reserve 8+ for faces that would stop a room.
  Most people should land between 4 and 6.5.
- Judge facial structure: bone structure, jaw and chin definition, cheekbones,
  eye shape and spacing, nose proportion, lip shape, symmetry, facial fat.
- Judge skin separately: clarity, evenness, texture, redness, under-eye area.
  Acne, scarring and poor skin should visibly lower the skin score.
- Ignore hair style, clothing, background, camera quality and lighting, except
  where lighting genuinely hides or distorts the face.
- If the photo is a profile or heavily obscured, still score what is visible.
- If no human face is present, set face_found to false and all scores to 0.

Never mention weight, race, ethnicity, age, disability, or any identity
characteristic. Never give medical advice. Do not insult the person.

strengths: up to 3 short, specific, positive observations about structure.
improvements: up to 3 short, actionable, cosmetic suggestions (grooming, skin
care, sleep, posture, styling). Never suggest surgery or procedures.`;

async function callGemini(model, key, b64) {
  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: 'image/jpeg', data: b64 } }
      ]
    }],
    generationConfig: {
      temperature: 0.15,
      topP: 0.9,
      maxOutputTokens: 800,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ]
  };

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  return res;
}

async function listModels(key) {
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=' + key);
    if (!r.ok) return [];
    const j = await r.json();
    return (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0)
      .map((m) => String(m.name || '').replace(/^models\//, ''));
  } catch (e) {
    return [];
  }
}

/* newest flash that can take an image, skipping image-generation and audio */
function rankModels(names) {
  const usable = names.filter((n) =>
    /flash/i.test(n) &&
    !/image|tts|live|audio|embedding|vision|omni/i.test(n) &&
    !/-preview-|customtools/i.test(n));
  if (!usable.length) return [];
  const scored = usable.map((n) => {
    const v = (n.match(/(\d+)\.(\d+)/) || []);
    const major = v[1] ? Number(v[1]) : 0;
    const minor = v[2] ? Number(v[2]) : 0;
    return { n, score: major * 100 + minor };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s2) => s2.n);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    fail(res, 405, 'method_not_allowed', 'This endpoint only accepts POST requests.');
    return;
  }

  // a browser sends Origin on a cross-origin POST; refuse a mismatch outright
  const origin = req.headers.origin || '';
  if (origin) {
    let ok = false;
    try { ok = new URL(origin).host === (req.headers.host || ''); } catch (e) { ok = false; }
    if (!ok) {
      fail(res, 403, 'bad_origin', 'Requests must come from the Lumorph site itself.');
      return;
    }
  }

  const key = process.env.GEMINI_KEY;
  if (!key) {
    fail(res, 503, 'not_configured', 'The AI read is not set up on this deployment yet. Ask the owner to add GEMINI_KEY.');
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const rate = checkRate(ip);
  if (!rate.ok) {
    res.setHeader('Retry-After', String(rate.retry));
    fail(res, 429, 'rate_limited',
      rate.scope === 'service'
        ? 'The AI read is at its hourly limit for everyone. Try again in about ' + Math.ceil(rate.retry / 60) + ' minutes.'
        : 'That is a lot of reads in a short time. Try again in ' + rate.retry + ' seconds.',
      { retry_after: rate.retry });
    return;
  }

  const ctype = String(req.headers['content-type'] || '');
  if (ctype.indexOf('application/json') < 0) {
    fail(res, 415, 'bad_content_type', 'Send the request as JSON.');
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    fail(res, 400, 'bad_json', 'That request body was not valid JSON.');
    return;
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail(res, 400, 'bad_body', 'Send an object with a single "image" field.');
    return;
  }

  const extra = Object.keys(body).filter((k) => k !== 'image');
  if (extra.length) {
    fail(res, 400, 'unexpected_fields', 'This endpoint only accepts an "image" field.');
    return;
  }

  const image = body.image;
  if (typeof image !== 'string' || !image) {
    fail(res, 400, 'no_image', 'No photo was included in the request.');
    return;
  }

  if (!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(image)) {
    fail(res, 400, 'bad_image', 'The photo must be a base64 JPEG, PNG or WebP data URL.');
    return;
  }

  if (image.length > MAX_B64) {
    fail(res, 413, 'too_large', 'That photo is too large. Lumorph sends a resized copy under 2.5MB.');
    return;
  }

  const b64 = image.replace(/^data:image\/[a-z]+;base64,/i, '').replace(/\s+/g, '');
  const bytes = Buffer.from(b64, 'base64');

  if (bytes.length < MIN_BYTES) {
    fail(res, 400, 'image_too_small', 'That photo is too small to read a face from.');
    return;
  }
  if (bytes.length > MAX_BYTES) {
    fail(res, 413, 'too_large', 'That photo is too large. Lumorph sends a resized copy under 2.5MB.');
    return;
  }

  // trust the bytes, not the label: a data URL claiming JPEG should start like one
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  const isWebp = bytes.slice(0, 4).toString('ascii') === 'RIFF' && bytes.slice(8, 12).toString('ascii') === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) {
    fail(res, 415, 'not_an_image', 'That file is not a JPEG, PNG or WebP image.');
    return;
  }

  const tried = [];
  let upstream = null;
  let usedModel = cachedModel;

  if (cachedModel) {
    upstream = await callGemini(cachedModel, key, b64);
    if (upstream.status === 404) { cachedModel = null; upstream = null; }
  }

  if (!upstream) {
    const shortlist = [CONFIGURED, ALIAS, 'gemini-2.5-flash', 'gemini-3.8-flash']
      .filter((m, i, arr) => m && arr.indexOf(m) === i);

    let lastFail = null;
    for (const m of shortlist) {
      if (tried.indexOf(m) >= 0) continue;
      tried.push(m);
      let r = await callGemini(m, key, b64);
      if (r.status === 503 || r.status === 429) {
        // "high demand" is usually a spike, not a wall: one short retry
        await new Promise((ok) => setTimeout(ok, 700));
        r = await callGemini(m, key, b64);
      }
      if (r.status !== 404 && r.status !== 503) { upstream = r; usedModel = m; break; }
      lastFail = r;
    }

    if (!upstream) {
      // every name we know is gone or busy: ask the API what it actually offers
      const available = await listModels(key);
      const ranked = rankModels(available).slice(0, 3);
      for (const pick of ranked) {
        if (tried.indexOf(pick) >= 0) continue;
        tried.push(pick);
        const r = await callGemini(pick, key, b64);
        if (r.status !== 404) { upstream = r; usedModel = pick; break; }
      }
    }

    if (!upstream && lastFail) upstream = lastFail;
    if (upstream && upstream.ok) cachedModel = usedModel;
  }

  if (!upstream) {
    fail(res, 502, 'no_model',
      'None of the AI models this build knows about are available right now. Set GEMINI_MODEL in Vercel to a current model name.');
    return;
  }

  if (!upstream.ok) {
    let detail = '';
    try {
      const j = await upstream.json();
      detail = (j.error && j.error.message) || '';
    } catch (e) { /* ignore */ }
    fail(res, upstream.status === 429 ? 429 : 502,
      upstream.status === 429 ? 'quota' : 'upstream', friendly(upstream.status, detail));
    return;
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch (e) {
    fail(res, 502, 'upstream_parse', 'The AI service sent back something unreadable. Try again.');
    return;
  }

  const cand = payload.candidates && payload.candidates[0];
  const text = cand && cand.content && cand.content.parts &&
    cand.content.parts.map((p) => p.text || '').join('');

  if (!text) {
    fail(res, 502, 'empty', 'The AI service returned nothing usable. Try again.');
    return;
  }

  let out;
  try {
    out = JSON.parse(text);
  } catch (e) {
    fail(res, 502, 'bad_json', 'The AI service answered in a format this build cannot read.');
    return;
  }

  const clamp = (v) => Math.max(0, Math.min(10, Math.round(Number(v) * 10) / 10));
  const clean = (arr) => (Array.isArray(arr) ? arr.filter((s) => typeof s === 'string').slice(0, 3) : []);

  res.status(200).json({
    ok: true,
    model: usedModel || cachedModel || '',
    face_found: !!out.face_found,
    attractiveness: clamp(out.attractiveness),
    harmony: clamp(out.harmony),
    skin: clamp(out.skin),
    tier: typeof out.tier === 'string' ? out.tier.slice(0, 40) : '',
    strengths: clean(out.strengths),
    improvements: clean(out.improvements)
  });
};
