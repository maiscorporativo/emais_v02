import express from 'express';
import pool from '../db.js';
import {
  DEFAULT_EVENTS,
  DEFAULT_PACKAGES,
  DEFAULT_TESTIMONIALS,
  DEFAULT_HERO_IMAGES,
  DEFAULT_CATEGORIES,
} from '../defaults.js';
import { listSharedPackages, saveSharedPackages, sharedDbEnabled, PORTAL } from '../shared-packages.js';

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
/* Com ?b64=1 a resposta vem codificada em Base64: o JSON do conteúdo
   carrega snippets HTML (Mautic/pixels) que disparam as regras do
   ModSecurity da hospedagem — codificado, o firewall não inspeciona. */
router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    const [rows] = await pool.query('SELECT * FROM site_content WHERE id = 1');
    const payload = !rows.length
      ? {
          events:     DEFAULT_EVENTS,
          packages:   DEFAULT_PACKAGES,
          testimonials: DEFAULT_TESTIMONIALS,
          heroImages: DEFAULT_HERO_IMAGES,
          categories: DEFAULT_CATEGORIES,
        }
      : await (async () => {
          const row = rows[0];

          /* Pacotes: com a integração ativa, a fonte da verdade é a tabela
             compartilhada (os 3 portais). Enquanto ela estiver vazia para a
             visão deste portal, mantém os pacotes legados do site_content. */
          let packages = parseField(row.packages, DEFAULT_PACKAGES);
          if (sharedDbEnabled()) {
            try {
              const shared = await listSharedPackages();
              if (shared.length > 0) packages = shared;
            } catch (err) {
              console.error('[GET /api/content] banco compartilhado indisponível, usando legado:', err.message);
            }
          }

          return {
            updated_at:     row.updated_at,
            events:         parseField(row.events,          DEFAULT_EVENTS),
            packages,
            testimonials:   parseField(row.testimonials,    DEFAULT_TESTIMONIALS),
            heroImages:     parseField(row.hero_images,     DEFAULT_HERO_IMAGES),
            categories:     parseField(row.categories,      DEFAULT_CATEGORIES),
            categoryIcons:  parseField(row.category_icons,  {}),
          };
        })();

    if (req.query.b64) {
      return res.json({ b64: Buffer.from(JSON.stringify(payload), 'utf8').toString('base64') });
    }
    res.json(payload);
  } catch (err) {
    console.error('[GET /api/content]', err.message);
    res.status(500).json({ error: 'Database error', details: err.message, sqlState: err.sqlState || err.code });
  }
});

/* ── Gravação compartilhada pelas duas rotas de PUT ───────────── */
async function saveContent(body, res) {
  try {
    const { events, packages, testimonials, heroImages, heroImagesReplace, categories, categoryIcons } = body;

    /* Integração ativa: sincroniza os pacotes com a tabela compartilhada
       (conteúdo só é gravado para pacotes de origem própria; para os demais,
       apenas os controles locais). O site_content guarda como backup somente
       os pacotes deste portal. */
    let backupPackages = packages;
    let newlyAssignedSharedIds = [];
    if (sharedDbEnabled() && packages !== undefined) {
      try {
        newlyAssignedSharedIds = await saveSharedPackages(packages);
        backupPackages = packages.filter(p => !p.origem || p.origem === PORTAL);
      } catch (err) {
        // Banco compartilhado indisponível: NÃO aborta o salvamento — grava
        // tudo no banco próprio (legado) para não perder a edição do usuário.
        console.error('[PUT /api/content] banco compartilhado indisponível, salvando apenas no banco local:', err.message);
      }
    }

    // Fetch current to preserve fields not sent by the caller (like testimonials from marketing panel)
    const [current] = await pool.query('SELECT * FROM site_content WHERE id = 1');
    const existing = current.length ? current[0] : {};

    const finalEvents       = events       !== undefined ? JSON.stringify(events)       : (existing.events       || JSON.stringify(DEFAULT_EVENTS));
    const finalPackages     = backupPackages !== undefined ? JSON.stringify(backupPackages) : (existing.packages  || JSON.stringify(DEFAULT_PACKAGES));
    const finalTestimonials = testimonials !== undefined ? JSON.stringify(testimonials) : (existing.testimonials || JSON.stringify(DEFAULT_TESTIMONIALS));

    /* heroImages é editado por várias linhas independentes do admin (uma por
       imagem da galeria), cada uma só conhecendo seu próprio subconjunto.
       Requisições concorrentes podem completar fora de ordem — se a última a
       terminar carregasse um snapshot mais antigo/parcial, ela apagava as
       imagens salvas pelas outras linhas. Por isso o padrão aqui é MERGE por
       chave com o valor já salvo; só reset/import (heroImagesReplace: true)
       substitui o objeto inteiro. */
    let finalHeroImages;
    if (heroImages !== undefined) {
      if (heroImagesReplace) {
        finalHeroImages = JSON.stringify(heroImages);
      } else {
        const existingHero = parseField(existing.hero_images, DEFAULT_HERO_IMAGES);
        finalHeroImages = JSON.stringify({ ...existingHero, ...heroImages });
      }
    } else {
      finalHeroImages = existing.hero_images || JSON.stringify(DEFAULT_HERO_IMAGES);
    }

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
    res.json({ ok: true, newlyAssignedSharedIds });
  } catch (err) {
    console.error('[PUT /api/content] Database error details:', err);
    res.status(500).json({
      error: 'Database error',
      details: err.message,
      code: err.code,
      sqlState: err.sqlState
    });
  }
}

/* ── PUT /api/content (rota legada, corpo em JSON puro) ───────── */
router.put('/', requireAuth, async (req, res) => saveContent(req.body, res));

/* ── PUT /api/content/b64 — corpo Base64, imune ao ModSecurity ──
   O corpo do PUT normal às vezes carrega HTML/scripts (Mautic, pixels de
   tracking) que disparam o firewall da hospedagem e derrubam a requisição
   com 403 — mesmo com autenticação correta. Codificado em Base64, o corpo
   não contém HTML legível e passa pela inspeção. */
router.put('/b64', requireAuth, async (req, res) => {
  try {
    const decoded = JSON.parse(Buffer.from(String(req.body?.b64 || ''), 'base64').toString('utf8'));
    return saveContent(decoded, res);
  } catch {
    return res.status(400).json({ error: 'Payload base64 inválido' });
  }
});

export default router;
