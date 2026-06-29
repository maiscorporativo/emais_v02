import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

/* ── Auth middleware — valida sessão no banco ──────────────────── */
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
    console.error('[requireAuth upload]', err.message);
    res.status(500).json({ error: 'Erro interno' });
  }
}


/* ── Garante que a pasta uploads/ existe ── */
const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/* ── Multer: salva em disco com nome único ── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.'));
    }
  },
});

/* ── POST /api/upload ── */
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  // Retorna URL pública relativa (servida pelo Express em produção ou Vite proxy em dev)
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

/* ── DELETE /api/upload?file=filename ── */
router.delete('/', requireAuth, async (req, res) => {
  const filename = req.query.file;
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "file" obrigatório.' });
  }

  // Prevenir path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(uploadsDir, safeName);

  // Verificar se o arquivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado.' });
  }

  try {
    fs.unlinkSync(filePath);
    res.json({ ok: true, deleted: safeName });
  } catch (err) {
    console.error('[delete upload]', err.message);
    res.status(500).json({ error: 'Erro ao deletar arquivo.' });
  }
});

/* ── Error handler para multer ── */
router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Arquivo muito grande. Máximo: 5 MB.' });
  }
  res.status(400).json({ error: err.message || 'Erro no upload.' });
});

export default router;
