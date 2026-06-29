import express from 'express';
import pool from '../db.js';
import {
  DEFAULT_EVENTS,
  DEFAULT_PACKAGES,
  DEFAULT_TESTIMONIALS,
  DEFAULT_HERO_IMAGES,
  DEFAULT_CATEGORIES,
} from '../defaults.js';

const router = express.Router();

/* ── SSE: connected clients ───────────────────────────────────── */
const sseClients = new Set();

function broadcastUpdate() {
  for (const client of sseClients) {
    try {
      client.write('data: update\n\n');
    } catch { sseClients.delete(client); }
  }
}

/* ── Parse JSON fields returned as strings by MySQL ───────────── */
function parseField(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

/* ── Auth middleware — valida sessão no banco ─────────────────── */
async function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  try {
    const [rows] = await pool.query(
      "SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW() LIMIT 1",
      [token]
    );
    if (!rows.length) return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
    req.authUser = rows[0];
    next();
  } catch (err) {
    console.error('[requireAuth]', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
}

/* ── GET /api/content/events  (SSE stream) ────────────────────── */
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(': connected\n\n');

  sseClients.add(res);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); }
    catch { clearInterval(heartbeat); sseClients.delete(res); }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

/* ── GET /api/content ─────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM site_content WHERE id = 1');
    if (!rows.length) {
      return res.json({
        events:     DEFAULT_EVENTS,
        packages:   DEFAULT_PACKAGES,
        testimonials: DEFAULT_TESTIMONIALS,
        heroImages: DEFAULT_HERO_IMAGES,
        categories: DEFAULT_CATEGORIES,
      });
    }
    const row = rows[0];
    res.json({
      updated_at:     row.updated_at,
      events:         parseField(row.events,          DEFAULT_EVENTS),
      packages:       parseField(row.packages,        DEFAULT_PACKAGES),
      testimonials:   parseField(row.testimonials,    DEFAULT_TESTIMONIALS),
      heroImages:     parseField(row.hero_images,     DEFAULT_HERO_IMAGES),
      categories:     parseField(row.categories,      DEFAULT_CATEGORIES),
      categoryIcons:  parseField(row.category_icons,  {}),
    });
  } catch (err) {
    console.error('[GET /api/content]', err.message);
    res.status(500).json({ error: 'Database error', details: err.message, sqlState: err.sqlState || err.code });
  }
});

/* ── PUT /api/content ─────────────────────────────────────────── */
router.put('/', requireAuth, async (req, res) => {
  const { events, packages, testimonials, heroImages, categories, categoryIcons } = req.body;
  try {
    await pool.query(
      `INSERT INTO site_content (id, events, packages, testimonials, hero_images, categories, category_icons)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         events          = VALUES(events),
         packages        = VALUES(packages),
         testimonials    = VALUES(testimonials),
         hero_images     = VALUES(hero_images),
         categories      = VALUES(categories),
         category_icons  = VALUES(category_icons)`,
      [
        JSON.stringify(events       ?? DEFAULT_EVENTS),
        JSON.stringify(packages     ?? DEFAULT_PACKAGES),
        JSON.stringify(testimonials ?? DEFAULT_TESTIMONIALS),
        JSON.stringify(heroImages   ?? DEFAULT_HERO_IMAGES),
        JSON.stringify(categories   ?? DEFAULT_CATEGORIES),
        JSON.stringify(categoryIcons ?? {}),
      ]
    );
    broadcastUpdate();
    res.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/content]', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
