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
const MAX_BYTES = 3 * 1024 * 1024;

/* very small in-memory limiter: survives within one warm instance, which is
   enough to blunt a naive loop against the key */
const hits = new Map();
const WINDOW = 60 * 1000;
const LIMIT = 12;

function limited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > WINDOW) { rec.n = 0; rec.t = now; }
  rec.n += 1;
  hits.set(ip, rec);
  return rec.n > LIMIT;
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
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const key = process.env.GEMINI_KEY;
  if (!key) {
    res.status(503).json({ error: 'not_configured', message: 'GEMINI_KEY is not set on this deployment.' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) {
    res.status(429).json({ error: 'rate_limited', message: 'Too many reads from this device. Try again in a minute.' });
    return;
  }

  let image = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    image = body.image || '';
  } catch (e) {
    res.status(400).json({ error: 'bad_body' });
    return;
  }

  if (!image || typeof image !== 'string') {
    res.status(400).json({ error: 'no_image' });
    return;
  }

  const b64 = image.replace(/^data:image\/[a-z]+;base64,/i, '');
  if (b64.length * 0.75 > MAX_BYTES) {
    res.status(413).json({ error: 'too_large' });
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
    res.status(502).json({
      error: 'no_model',
      message: 'None of the Gemini models this build knows about are available. Set GEMINI_MODEL in Vercel to a current model name.'
    });
    return;
  }

  if (!upstream.ok) {
    let detail = '';
    try {
      const j = await upstream.json();
      detail = (j.error && j.error.message) || '';
    } catch (e) { /* ignore */ }
    res.status(upstream.status === 429 ? 429 : 502).json({
      error: upstream.status === 429 ? 'quota' : 'upstream',
      message: detail.slice(0, 200) || 'The model did not answer.'
    });
    return;
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch (e) {
    res.status(502).json({ error: 'upstream_parse' });
    return;
  }

  const cand = payload.candidates && payload.candidates[0];
  const text = cand && cand.content && cand.content.parts &&
    cand.content.parts.map((p) => p.text || '').join('');

  if (!text) {
    res.status(502).json({ error: 'empty', message: 'The model returned nothing usable.' });
    return;
  }

  let out;
  try {
    out = JSON.parse(text);
  } catch (e) {
    res.status(502).json({ error: 'bad_json' });
    return;
  }

  const clamp = (v) => Math.max(0, Math.min(10, Math.round(Number(v) * 10) / 10));
  const clean = (arr) => (Array.isArray(arr) ? arr.filter((s) => typeof s === 'string').slice(0, 3) : []);

  res.status(200).json({
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
