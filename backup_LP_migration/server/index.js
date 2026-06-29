import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import contentRouter from './routes/content.js';
import uploadRouter from './routes/upload.js';
import authRouter from './routes/auth.js';
import contactRouter from './routes/contact.js';
import pool from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

/* ── Middleware ─────────────────────────────────────────────── */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true })); // parse form POST do ContactForm

/* ── Servir uploads estáticos (imagens salvas no disco) ─────────── */
const publicPath = join(__dirname, '..', 'public');
app.use(express.static(publicPath));

/* ── API Routes ─────────────────────────────────────────────── */
app.use('/api/content', contentRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

/* ── Serve React in production ──────────────────────────────── */
const distPath = join(__dirname, '..', 'dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  // SPA fallback — serve index.html for all non-API routes
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

/* ── Start ──────────────────────────────────────────────────── */

/* Auto-migração: garante colunas LONGTEXT e cria category_icons se não existir */
async function autoMigrate() {
  const cols = ['events', 'packages', 'testimonials', 'hero_images', 'categories'];
  try {
    // Criar tabela user_sessions se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token      VARCHAR(64)              NOT NULL PRIMARY KEY,
        user_id    INT                      NOT NULL,
        username   VARCHAR(255)             NOT NULL,
        role       ENUM('admin','master')   NOT NULL,
        created_at DATETIME DEFAULT         CURRENT_TIMESTAMP,
        expires_at DATETIME                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Limpar sessões expiradas
    const [del] = await pool.query('DELETE FROM user_sessions WHERE expires_at < NOW()');
    if (del.affectedRows > 0) console.log(`🗑️  ${del.affectedRows} sessão(ões) expirada(s) removida(s)`);

    // Criar categories se não existir
    const [checkCat] = await pool.query(
      `SELECT COUNT(*) as c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'categories'`
    );
    if (checkCat[0].c === 0) {
      await pool.query(`ALTER TABLE site_content ADD COLUMN categories LONGTEXT`);
      console.log('✅ Coluna categories criada');
    }

    // Criar category_icons se não existir
    const [checkRows] = await pool.query(
      `SELECT COUNT(*) as c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content' AND COLUMN_NAME = 'category_icons'`
    );
    if (checkRows[0].c === 0) {
      await pool.query(`ALTER TABLE site_content ADD COLUMN category_icons LONGTEXT`);
      console.log('✅ Coluna category_icons criada');
    }

    // Migrar colunas existentes para LONGTEXT
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'site_content'
       AND COLUMN_NAME IN (${cols.map(() => '?').join(',')})`,
      cols
    );
    const needsMigration = rows.filter(r => r.DATA_TYPE !== 'longtext').map(r => r.COLUMN_NAME);
    if (needsMigration.length > 0) {
      console.log(`⚡ Migrando colunas para LONGTEXT: ${needsMigration.join(', ')}`);
      for (const col of needsMigration) {
        await pool.query(`ALTER TABLE site_content MODIFY COLUMN \`${col}\` LONGTEXT`);
      }
      console.log('✅ Colunas migradas para LONGTEXT');
    }
  } catch (e) {
    console.warn('⚠️ Auto-migração falhou (não crítico):', e.message);
  }
}

app.listen(PORT, async () => {
  await autoMigrate();
  console.log(`\n🚀 E-Mais API rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Banco:    ${process.env.DB_NAME || 'emais_cms'} @ ${process.env.DB_HOST || 'localhost'}\n`);
});

