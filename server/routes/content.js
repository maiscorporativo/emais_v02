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
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
  try {
    const { events, packages, testimonials, heroImages, categories, categoryIcons } = req.body;

    // Fetch current to preserve fields not sent by the caller (like testimonials from marketing panel)
    const [current] = await pool.query('SELECT * FROM site_content WHERE id = 1');
    const existing = current.length ? current[0] : {};

    const finalEvents       = events       !== undefined ? JSON.stringify(events)       : (existing.events       || JSON.stringify(DEFAULT_EVENTS));
    const finalPackages     = packages     !== undefined ? JSON.stringify(packages)     : (existing.packages     || JSON.stringify(DEFAULT_PACKAGES));
    const finalTestimonials = testimonials !== undefined ? JSON.stringify(testimonials) : (existing.testimonials || JSON.stringify(DEFAULT_TESTIMONIALS));
    const finalHeroImages   = heroImages   !== undefined ? JSON.stringify(heroImages)   : (existing.hero_images   || JSON.stringify(DEFAULT_HERO_IMAGES));
    const finalCategories   = categories   !== undefined ? JSON.stringify(categories)   : (existing.categories   || JSON.stringify(DEFAULT_CATEGORIES));
    const finalIcons        = categoryIcons !== undefined ? JSON.stringify(categoryIcons) : (existing.category_icons || '{}');

    console.log(`[PUT /api/content] Updating content. Packages: ${packages?.length || '?'}`);

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
      [finalEvents, finalPackages, finalTestimonials, finalHeroImages, finalCategories, finalIcons]
    );
    broadcastUpdate();
    res.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/content] Database error details:', err);
    res.status(500).json({ 
      error: 'Database error', 
      details: err.message, 
      code: err.code,
      sqlState: err.sqlState 
    });
  }
});

export default router;
